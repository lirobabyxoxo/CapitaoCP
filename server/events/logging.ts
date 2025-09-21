import { 
  Client, 
  Message, 
  GuildMember,
  PartialGuildMember, 
  Guild, 
  GuildChannel, 
  Role,
  Invite,
  PartialMessage,
  AuditLogEvent,
  ChannelType,
  TextChannel
} from "discord.js";
import { storage } from "../storage.js";
import { createLogEmbed } from "../utils/embedBuilder.js";

export function setupLogging(client: Client) {
  // Message logging
  client.on("messageDelete", async (message: Message | PartialMessage) => {
    if (!message.guild || message.author?.bot) return;
    
    const config = await storage.getServerConfig(message.guild.id);
    const logChannelId = config?.logChannels?.messages;
    
    if (!logChannelId) return;
    
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    
    const embed = createLogEmbed("🗑️", "Message Deleted")
      .addFields(
        { name: "Author", value: message.author?.tag || "Unknown", inline: true },
        { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
        { name: "Content", value: message.content?.slice(0, 1000) || "No content", inline: false }
      );
    
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send delete log:", error);
    }
  });
  
  client.on("messageUpdate", async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    const config = await storage.getServerConfig(newMessage.guild.id);
    const logChannelId = config?.logChannels?.messages;
    
    if (!logChannelId) return;
    
    const logChannel = newMessage.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    
    const embed = createLogEmbed("✏️", "Message Edited")
      .addFields(
        { name: "Author", value: newMessage.author?.tag || "Unknown", inline: true },
        { name: "Channel", value: `<#${newMessage.channel.id}>`, inline: true },
        { 
          name: "Before", 
          value: `\`\`\`${oldMessage.content?.slice(0, 500) || "No content"}\`\`\``, 
          inline: false 
        },
        { 
          name: "After", 
          value: `\`\`\`${newMessage.content?.slice(0, 500) || "No content"}\`\`\``, 
          inline: false 
        }
      );
    
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send edit log:", error);
    }
  });
  
  // Member logging
  client.on("guildMemberUpdate", async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    if (!oldMember.guild || oldMember.partial) return;
    const config = await storage.getServerConfig(newMember.guild.id);
    const logChannelId = config?.logChannels?.members;
    
    if (!logChannelId) return;
    
    const logChannel = newMember.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    
    // Check for nickname changes
    if (oldMember.nickname !== newMember.nickname) {
      const embed = createLogEmbed("👤", "Nickname Changed")
        .addFields(
          { name: "User", value: newMember.user.tag, inline: true },
          { name: "Old Nickname", value: oldMember.nickname || "None", inline: true },
          { name: "New Nickname", value: newMember.nickname || "None", inline: true }
        );
      
      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error("Failed to send nickname log:", error);
      }
    }
    
    // Check for avatar changes
    if (oldMember.user.avatar !== newMember.user.avatar) {
      const embed = createLogEmbed("🖼️", "Avatar Changed")
        .addFields(
          { name: "User", value: newMember.user.tag, inline: true }
        )
        .setThumbnail(newMember.user.displayAvatarURL({ size: 128 }));
      
      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error("Failed to send avatar log:", error);
      }
    }
  });
  
  // Server logging
  client.on("inviteCreate", async (invite: Invite) => {
    if (!invite.guild) return;
    
    const config = await storage.getServerConfig(invite.guild.id);
    const logChannelId = config?.logChannels?.server;
    
    if (!logChannelId) return;
    
    if (!('channels' in invite.guild)) return;
    const logChannel = invite.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    
    const embed = createLogEmbed("📨", "Invite Created")
      .addFields(
        { name: "Code", value: invite.code, inline: true },
        { name: "Channel", value: `<#${invite.channel?.id}>`, inline: true },
        { name: "Created by", value: invite.inviter?.tag || "Unknown", inline: true },
        { name: "Max Uses", value: invite.maxUses?.toString() || "Unlimited", inline: true },
        { name: "Expires", value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : "Never", inline: true }
      );
    
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send invite log:", error);
    }
  });
  
  client.on("channelCreate", async (channel: GuildChannel) => {
    if (!channel.guild) return;
    
    const config = await storage.getServerConfig(channel.guild.id);
    const logChannelId = config?.logChannels?.server;
    
    if (!logChannelId) return;
    
    const logChannel = channel.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    
    const channelType = channel.type === ChannelType.GuildText ? "Text Channel" :
                       channel.type === ChannelType.GuildVoice ? "Voice Channel" :
                       channel.type === ChannelType.GuildCategory ? "Category" :
                       "Unknown";
    
    const embed = createLogEmbed("📁", "Channel Created")
      .addFields(
        { name: "Channel", value: `<#${channel.id}>`, inline: true },
        { name: "Type", value: channelType, inline: true },
        { name: "Category", value: channel.parent?.name || "None", inline: true }
      );
    
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send channel create log:", error);
    }
  });
  
  client.on("channelDelete", async (channel) => {
    if (!('guild' in channel) || !channel.guild) return;
    const guildChannel = channel as GuildChannel;
    
    const config = await storage.getServerConfig(guildChannel.guild.id);
    const logChannelId = config?.logChannels?.server;
    
    if (!logChannelId) return;
    
    const logChannel = guildChannel.guild.channels.cache.get(logChannelId) as TextChannel;
    if (!logChannel || logChannel.id === guildChannel.id) return; // Don't log if the log channel itself was deleted
    
    const channelType = guildChannel.type === ChannelType.GuildText ? "Text Channel" :
                       guildChannel.type === ChannelType.GuildVoice ? "Voice Channel" :
                       guildChannel.type === ChannelType.GuildCategory ? "Category" :
                       "Unknown";
    
    const embed = createLogEmbed("🗑️", "Channel Deleted")
      .addFields(
        { name: "Channel Name", value: guildChannel.name, inline: true },
        { name: "Type", value: channelType, inline: true },
        { name: "Category", value: guildChannel.parent?.name || "None", inline: true }
      );
    
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send channel delete log:", error);
    }
  });
  
  client.on("roleCreate", async (role: Role) => {
    const config = await storage.getServerConfig(role.guild.id);
    const logChannelId = config?.logChannels?.server;
    
    if (!logChannelId) return;
    
    const logChannel = role.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    
    const embed = createLogEmbed("🏷️", "Role Created")
      .addFields(
        { name: "Role", value: `<@&${role.id}>`, inline: true },
        { name: "Color", value: role.hexColor, inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true }
      );
    
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send role create log:", error);
    }
  });
  
  client.on("roleDelete", async (role: Role) => {
    const config = await storage.getServerConfig(role.guild.id);
    const logChannelId = config?.logChannels?.server;
    
    if (!logChannelId) return;
    
    const logChannel = role.guild.channels.cache.get(logChannelId);
    if (!logChannel || !logChannel.isTextBased()) return;
    
    const embed = createLogEmbed("🗑️", "Role Deleted")
      .addFields(
        { name: "Role Name", value: role.name, inline: true },
        { name: "Color", value: role.hexColor, inline: true },
        { name: "Members", value: role.members.size.toString(), inline: true }
      );
    
    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error("Failed to send role delete log:", error);
    }
  });
}

// Check for expired mutes periodically
export function setupMuteChecker(client: Client) {
  setInterval(async () => {
    try {
      const expiredMutes = await storage.getExpiredMutes();
      
      for (const mute of expiredMutes) {
        try {
          const guild = client.guilds.cache.get(mute.guildId);
          if (!guild) continue;
          
          const member = await guild.members.fetch(mute.userId);
          if (!member) continue;
          
          await member.timeout(null);
          console.log(`Auto-unmuted ${member.user.tag} in ${guild.name}`);
        } catch (error) {
          console.error(`Failed to auto-unmute ${mute.userId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error checking expired mutes:", error);
    }
  }, 60000); // Check every minute
}
