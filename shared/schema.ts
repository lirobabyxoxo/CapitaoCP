import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  discriminator: text("discriminator"),
  avatar: text("avatar"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const marriages = pgTable("marriages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId1: varchar("user_id_1").notNull(),
  userId2: varchar("user_id_2").notNull(),
  marriedAt: timestamp("married_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const marriageHistory = pgTable("marriage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  partnerId: varchar("partner_id").notNull(),
  marriedAt: timestamp("married_at").notNull(),
  divorcedAt: timestamp("divorced_at"),
});

export const serverConfig = pgTable("server_config", {
  guildId: varchar("guild_id").primaryKey(),
  clearSystemEnabled: boolean("clear_system_enabled").default(false),
  clearTrigger: text("clear_trigger").default(".cl"),
  clearRoles: json("clear_roles").$type<string[]>().default([]),
  clearUsers: json("clear_users").$type<string[]>().default([]),
  logChannels: json("log_channels").$type<{
    messages?: string;
    members?: string;
    server?: string;
  }>().default({}),
});

export const userMutes = pgTable("user_mutes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  guildId: varchar("guild_id").notNull(),
  mutedAt: timestamp("muted_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  reason: text("reason"),
  moderatorId: varchar("moderator_id").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({
  joinedAt: true,
});

export const insertMarriageSchema = createInsertSchema(marriages).omit({
  id: true,
  marriedAt: true,
  isActive: true,
});

export const insertServerConfigSchema = createInsertSchema(serverConfig);

export const insertUserMuteSchema = createInsertSchema(userMutes).omit({
  id: true,
  mutedAt: true,
  isActive: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Marriage = typeof marriages.$inferSelect;
export type InsertMarriage = z.infer<typeof insertMarriageSchema>;
export type ServerConfig = typeof serverConfig.$inferSelect;
export type InsertServerConfig = z.infer<typeof insertServerConfigSchema>;
export type UserMute = typeof userMutes.$inferSelect;
export type InsertUserMute = z.infer<typeof insertUserMuteSchema>;
export type MarriageHistory = typeof marriageHistory.$inferSelect;
