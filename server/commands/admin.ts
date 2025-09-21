import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  GuildMember,
  User
} from "discord.js";
import { createSuccessEmbed, createErrorEmbed } from "../utils/embedBuilder.js";
import { parseTimeString, formatDuration } from "../utils/timeParser.js";
import { storage } from "../storage.js";
import { BOT_CONFIG } from "../config.js";

export const adminCommands = [
  // Ban command
  {
    data: new SlashCommandBuilder()
      .setName("vaza")
      .setDescription("Ban a user from the server")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to ban")
          .setRequired(true))
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for the ban")
          .setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild) return;
      
      const targetUser = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") || "No reason provided";
      const moderator = interaction.user;
      
      try {
        await interaction.guild.members.ban(targetUser, { reason });
        
        const embed = createSuccessEmbed("User Banned")
          .addFields(
            { name: "User", value: `${targetUser.tag}`, inline: true },
            { name: "Reason", value: reason, inline: true },
            { name: "Moderator", value: moderator.tag, inline: true }
          );
        
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = createErrorEmbed("Ban Failed", "Could not ban the user. Check permissions and try again.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },

  // Kick command
  {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick a user from the server")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to kick")
          .setRequired(true))
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for the kick")
          .setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild) return;
      
      const targetUser = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") || "No reason provided";
      const moderator = interaction.user;
      
      try {
        const member = await interaction.guild.members.fetch(targetUser.id);
        await member.kick(reason);
        
        const embed = createSuccessEmbed("User Kicked")
          .addFields(
            { name: "User", value: `${targetUser.tag}`, inline: true },
            { name: "Reason", value: reason, inline: true },
            { name: "Moderator", value: moderator.tag, inline: true }
          );
        
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = createErrorEmbed("Kick Failed", "Could not kick the user. Check permissions and try again.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },

  // Mute command
  {
    data: new SlashCommandBuilder()
      .setName("mute")
      .setDescription("Mute a user for a specified time")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to mute")
          .setRequired(true))
      .addStringOption(option =>
        option.setName("duration")
          .setDescription("Duration (e.g., 1h, 30m, 2d)")
          .setRequired(true))
      .addStringOption(option =>
        option.setName("reason")
          .setDescription("Reason for the mute")
          .setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild) return;
      
      const targetUser = interaction.options.getUser("user", true);
      const durationStr = interaction.options.getString("duration", true);
      const reason = interaction.options.getString("reason") || "No reason provided";
      const moderator = interaction.user;
      
      const durationMs = parseTimeString(durationStr);
      if (!durationMs) {
        const embed = createErrorEmbed("Invalid Duration", "Please use format like: 1s, 5m, 2h, 1d");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      // Check limits
      if (durationMs < BOT_CONFIG.MUTE_LIMITS.MIN_SECONDS * 1000 || 
          durationMs > BOT_CONFIG.MUTE_LIMITS.MAX_DAYS * 24 * 60 * 60 * 1000) {
        const embed = createErrorEmbed("Duration Out of Range", "Mute duration must be between 1 second and 28 days.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      try {
        const member = await interaction.guild.members.fetch(targetUser.id);
        const expiresAt = new Date(Date.now() + durationMs);
        
        await member.timeout(durationMs, reason);
        
        // Store mute in database
        await storage.createMute({
          userId: targetUser.id,
          guildId: interaction.guild.id,
          expiresAt,
          reason,
          moderatorId: moderator.id,
        });
        
        const embed = createSuccessEmbed("User Muted")
          .addFields(
            { name: "User", value: `${targetUser.tag}`, inline: true },
            { name: "Duration", value: formatDuration(durationMs), inline: true },
            { name: "Reason", value: reason, inline: true },
            { name: "Expires", value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true }
          );
        
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = createErrorEmbed("Mute Failed", "Could not mute the user. Check permissions and try again.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },

  // Unmute command
  {
    data: new SlashCommandBuilder()
      .setName("unmute")
      .setDescription("Unmute a user")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to unmute")
          .setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild) return;
      
      const targetUser = interaction.options.getUser("user", true);
      const moderator = interaction.user;
      
      try {
        const member = await interaction.guild.members.fetch(targetUser.id);
        await member.timeout(null);
        
        // Remove mute from database
        await storage.removeMute(targetUser.id, interaction.guild.id);
        
        const embed = createSuccessEmbed("User Unmuted")
          .addFields(
            { name: "User", value: `${targetUser.tag}`, inline: true },
            { name: "Moderator", value: moderator.tag, inline: true }
          );
        
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = createErrorEmbed("Unmute Failed", "Could not unmute the user. Check permissions and try again.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },

  // Unban command
  {
    data: new SlashCommandBuilder()
      .setName("unban")
      .setDescription("Unban a user")
      .addStringOption(option =>
        option.setName("userid")
          .setDescription("User ID to unban")
          .setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild) return;
      
      const userId = interaction.options.getString("userid", true);
      const moderator = interaction.user;
      
      try {
        await interaction.guild.members.unban(userId);
        
        const embed = createSuccessEmbed("User Unbanned")
          .addFields(
            { name: "User ID", value: userId, inline: true },
            { name: "Moderator", value: moderator.tag, inline: true }
          );
        
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        const embed = createErrorEmbed("Unban Failed", "Could not unban the user. Check if the user is banned and try again.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },
];
