import { type User, type InsertUser, type Marriage, type InsertMarriage, type ServerConfig, type InsertServerConfig, type UserMute, type InsertUserMute, type MarriageHistory } from "@shared/schema";
import { users, marriages, marriageHistory, serverConfig, userMutes } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, or, desc, lt, isNull } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  // Marriage operations
  getMarriage(userId: string): Promise<Marriage | undefined>;
  createMarriage(marriage: InsertMarriage): Promise<Marriage>;
  divorceMarriage(userId: string): Promise<boolean>;
  getMarriageHistory(userId: string): Promise<MarriageHistory[]>;
  addMarriageHistory(userId: string, partnerId: string, marriedAt: Date, divorcedAt?: Date): Promise<void>;

  // Server config operations
  getServerConfig(guildId: string): Promise<ServerConfig | undefined>;
  updateServerConfig(guildId: string, config: Partial<ServerConfig>): Promise<ServerConfig>;

  // Mute operations
  getMute(userId: string, guildId: string): Promise<UserMute | undefined>;
  createMute(mute: InsertUserMute): Promise<UserMute>;
  removeMute(userId: string, guildId: string): Promise<boolean>;
  getExpiredMutes(): Promise<UserMute[]>;
}

// In-Memory Storage Implementation (for testing)
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private marriages: Map<string, Marriage> = new Map();
  private marriageHistory: Map<string, MarriageHistory[]> = new Map();
  private serverConfigs: Map<string, ServerConfig> = new Map();
  private mutes: Map<string, UserMute> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser, 
      discriminator: insertUser.discriminator || null,
      avatar: insertUser.avatar || null,
      joinedAt: new Date() 
    };
    this.users.set(insertUser.id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getMarriage(userId: string): Promise<Marriage | undefined> {
    for (const marriage of Array.from(this.marriages.values())) {
      if ((marriage.userId1 === userId || marriage.userId2 === userId) && marriage.isActive) {
        return marriage;
      }
    }
    return undefined;
  }

  async createMarriage(insertMarriage: InsertMarriage): Promise<Marriage> {
    const id = randomUUID();
    const marriage: Marriage = {
      ...insertMarriage,
      id,
      marriedAt: new Date(),
      isActive: true,
    };
    this.marriages.set(id, marriage);
    
    // Add to history for both users
    await this.addMarriageHistory(insertMarriage.userId1, insertMarriage.userId2, new Date());
    await this.addMarriageHistory(insertMarriage.userId2, insertMarriage.userId1, new Date());
    
    return marriage;
  }

  async divorceMarriage(userId: string): Promise<boolean> {
    for (const marriage of Array.from(this.marriages.values())) {
      if ((marriage.userId1 === userId || marriage.userId2 === userId) && marriage.isActive) {
        marriage.isActive = false;
        this.marriages.set(marriage.id, marriage);
        
        // Update marriage history
        const partnerId = marriage.userId1 === userId ? marriage.userId2 : marriage.userId1;
        const now = new Date();
        
        // Update history for both users
        this.updateMarriageHistoryDivorce(userId, partnerId, now);
        this.updateMarriageHistoryDivorce(partnerId, userId, now);
        
        return true;
      }
    }
    return false;
  }

  private updateMarriageHistoryDivorce(userId: string, partnerId: string, divorcedAt: Date): void {
    const history = this.marriageHistory.get(userId) || [];
    const latestMarriage = history.find(h => h.partnerId === partnerId && !h.divorcedAt);
    if (latestMarriage) {
      latestMarriage.divorcedAt = divorcedAt;
      this.marriageHistory.set(userId, history);
    }
  }

  async getMarriageHistory(userId: string): Promise<MarriageHistory[]> {
    return this.marriageHistory.get(userId) || [];
  }

  async addMarriageHistory(userId: string, partnerId: string, marriedAt: Date, divorcedAt?: Date): Promise<void> {
    const history = this.marriageHistory.get(userId) || [];
    const record: MarriageHistory = {
      id: randomUUID(),
      userId,
      partnerId,
      marriedAt,
      divorcedAt: divorcedAt || null,
    };
    history.push(record);
    this.marriageHistory.set(userId, history);
  }

  async getServerConfig(guildId: string): Promise<ServerConfig | undefined> {
    return this.serverConfigs.get(guildId);
  }

  async updateServerConfig(guildId: string, config: Partial<ServerConfig>): Promise<ServerConfig> {
    const existing = this.serverConfigs.get(guildId) || {
      guildId,
      clearSystemEnabled: false,
      clearTrigger: ".cl",
      clearRoles: [],
      clearUsers: [],
      logChannels: {},
    };
    
    const updated = { ...existing, ...config };
    this.serverConfigs.set(guildId, updated);
    return updated;
  }

  async getMute(userId: string, guildId: string): Promise<UserMute | undefined> {
    const key = `${userId}-${guildId}`;
    const mute = this.mutes.get(key);
    if (mute && mute.isActive) {
      // Check if expired
      if (mute.expiresAt && new Date() > mute.expiresAt) {
        mute.isActive = false;
        this.mutes.set(key, mute);
        return undefined;
      }
      return mute;
    }
    return undefined;
  }

  async createMute(insertMute: InsertUserMute): Promise<UserMute> {
    const id = randomUUID();
    const mute: UserMute = {
      ...insertMute,
      id,
      mutedAt: new Date(),
      isActive: true,
      expiresAt: insertMute.expiresAt || null,
      reason: insertMute.reason || null,
    };
    const key = `${insertMute.userId}-${insertMute.guildId}`;
    this.mutes.set(key, mute);
    return mute;
  }

  async removeMute(userId: string, guildId: string): Promise<boolean> {
    const key = `${userId}-${guildId}`;
    const mute = this.mutes.get(key);
    if (mute && mute.isActive) {
      mute.isActive = false;
      this.mutes.set(key, mute);
      return true;
    }
    return false;
  }

  async getExpiredMutes(): Promise<UserMute[]> {
    const now = new Date();
    const expired: UserMute[] = [];
    
    for (const mute of Array.from(this.mutes.values())) {
      if (mute.isActive && mute.expiresAt && now > mute.expiresAt) {
        mute.isActive = false;
        expired.push(mute);
      }
    }
    
    return expired;
  }
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      discriminator: insertUser.discriminator || null,
      avatar: insertUser.avatar || null,
    }).returning();
    return result[0];
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Marriage operations
  async getMarriage(userId: string): Promise<Marriage | undefined> {
    const result = await db.select().from(marriages)
      .where(and(
        or(eq(marriages.userId1, userId), eq(marriages.userId2, userId)),
        eq(marriages.isActive, true)
      ))
      .limit(1);
    return result[0];
  }

  async createMarriage(insertMarriage: InsertMarriage): Promise<Marriage> {
    const result = await db.insert(marriages).values(insertMarriage).returning();
    const marriage = result[0];
    
    // Add to history for both users
    await this.addMarriageHistory(insertMarriage.userId1, insertMarriage.userId2, marriage.marriedAt || new Date());
    await this.addMarriageHistory(insertMarriage.userId2, insertMarriage.userId1, marriage.marriedAt || new Date());
    
    return marriage;
  }

  async divorceMarriage(userId: string): Promise<boolean> {
    const marriage = await this.getMarriage(userId);
    if (!marriage) return false;

    await db.update(marriages)
      .set({ isActive: false })
      .where(eq(marriages.id, marriage.id));

    // Update marriage history
    const partnerId = marriage.userId1 === userId ? marriage.userId2 : marriage.userId1;
    const now = new Date();
    
    // Update history for both users
    await this.updateMarriageHistoryDivorce(userId, partnerId, now);
    await this.updateMarriageHistoryDivorce(partnerId, userId, now);
    
    return true;
  }

  private async updateMarriageHistoryDivorce(userId: string, partnerId: string, divorcedAt: Date): Promise<void> {
    await db.update(marriageHistory)
      .set({ divorcedAt })
      .where(and(
        eq(marriageHistory.userId, userId),
        eq(marriageHistory.partnerId, partnerId),
        isNull(marriageHistory.divorcedAt)
      ));
  }

  async getMarriageHistory(userId: string): Promise<MarriageHistory[]> {
    return await db.select().from(marriageHistory)
      .where(eq(marriageHistory.userId, userId))
      .orderBy(desc(marriageHistory.marriedAt));
  }

  async addMarriageHistory(userId: string, partnerId: string, marriedAt: Date, divorcedAt?: Date): Promise<void> {
    await db.insert(marriageHistory).values({
      userId,
      partnerId,
      marriedAt,
      divorcedAt: divorcedAt || null,
    });
  }

  // Server config operations
  async getServerConfig(guildId: string): Promise<ServerConfig | undefined> {
    const result = await db.select().from(serverConfig).where(eq(serverConfig.guildId, guildId)).limit(1);
    return result[0];
  }

  async updateServerConfig(guildId: string, config: Partial<ServerConfig>): Promise<ServerConfig> {
    const existing = await this.getServerConfig(guildId);
    
    if (existing) {
      const result = await db.update(serverConfig)
        .set(config)
        .where(eq(serverConfig.guildId, guildId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(serverConfig).values({
        guildId,
        clearSystemEnabled: false,
        clearTrigger: ".cl",
        clearRoles: [],
        clearUsers: [],
        logChannels: {},
        ...config,
      }).returning();
      return result[0];
    }
  }

  // Mute operations
  async getMute(userId: string, guildId: string): Promise<UserMute | undefined> {
    const result = await db.select().from(userMutes)
      .where(and(
        eq(userMutes.userId, userId),
        eq(userMutes.guildId, guildId),
        eq(userMutes.isActive, true)
      ))
      .limit(1);
    
    const mute = result[0];
    if (mute && mute.expiresAt && new Date() > mute.expiresAt) {
      // Mark as expired
      await db.update(userMutes)
        .set({ isActive: false })
        .where(eq(userMutes.id, mute.id));
      return undefined;
    }
    
    return mute;
  }

  async createMute(insertMute: InsertUserMute): Promise<UserMute> {
    const result = await db.insert(userMutes).values({
      ...insertMute,
      expiresAt: insertMute.expiresAt || null,
      reason: insertMute.reason || null,
    }).returning();
    return result[0];
  }

  async removeMute(userId: string, guildId: string): Promise<boolean> {
    const result = await db.update(userMutes)
      .set({ isActive: false })
      .where(and(
        eq(userMutes.userId, userId),
        eq(userMutes.guildId, guildId),
        eq(userMutes.isActive, true)
      ))
      .returning();
    
    return result.length > 0;
  }

  async getExpiredMutes(): Promise<UserMute[]> {
    const now = new Date();
    const result = await db.select().from(userMutes)
      .where(and(
        eq(userMutes.isActive, true),
        lt(userMutes.expiresAt, now)
      ));
    
    // Update them to inactive
    if (result.length > 0) {
      const expiredIds = result.map(mute => mute.id);
      await db.update(userMutes)
        .set({ isActive: false })
        .where(and(
          eq(userMutes.isActive, true),
          lt(userMutes.expiresAt, now)
        ));
    }
    
    return result;
  }
}

export const storage = new PostgreSQLStorage();
