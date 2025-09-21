import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ButtonInteraction,
  User
} from "discord.js";
import { createBaseEmbed, createErrorEmbed, createSuccessEmbed } from "../utils/embedBuilder.js";
import { storage } from "../storage.js";
import { formatRelativeTime } from "../utils/timeParser.js";
import { BOT_CONFIG } from "../config.js";

export const marryCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("marry")
      .setDescription("Propose to someone or check your marriage status")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to propose to")
          .setRequired(false)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user");
      const author = interaction.user;
      
      // Check marriage status if no target user
      if (!targetUser) {
        const marriage = await storage.getMarriage(author.id);
        
        if (!marriage) {
          await interaction.reply(`<@${author.id}> tu não tem ninguém 🤣`);
          return;
        }
        
        const partnerId = marriage.userId1 === author.id ? marriage.userId2 : marriage.userId1;
        const partner = await interaction.client.users.fetch(partnerId);
        const marriageHistory = await storage.getMarriageHistory(author.id);
        
        const marriedDate = marriage.marriedAt || new Date();
        const embed = createBaseEmbed()
          .setTitle("💑 Marriage Status")
          .addFields(
            { name: "Partner", value: `${partner.tag}`, inline: true },
            { name: "Married for", value: formatRelativeTime(marriedDate), inline: true },
            { name: "Marriage Date", value: `<t:${Math.floor(marriedDate.getTime() / 1000)}:D>`, inline: true }
          );
        
        if (marriageHistory.length > 1) {
          const historyText = marriageHistory
            .slice(0, 3) // Show max 3 entries
            .map(h => {
              const status = h.divorcedAt ? "(divorced)" : "(current)";
              return `• <t:${Math.floor(h.marriedAt.getTime() / 1000)}:d> ${status}`;
            })
            .join("\n");
          
          embed.addFields({
            name: "Marriage History",
            value: historyText,
            inline: false
          });
        }
        
        const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`divorce_${author.id}`)
              .setLabel("Divorce 💔")
              .setStyle(ButtonStyle.Danger)
          );
        
        await interaction.reply({ embeds: [embed], components: [row] });
        return;
      }
      
      // Proposal logic
      if (targetUser.id === author.id) {
        const embed = createErrorEmbed("Invalid Target", "You cannot marry yourself!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      if (targetUser.bot) {
        const embed = createErrorEmbed("Invalid Target", "You cannot marry a bot!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      // Check if author is already married
      const authorMarriage = await storage.getMarriage(author.id);
      if (authorMarriage) {
        const embed = createErrorEmbed("Already Married", "You are already married! Divorce first before proposing to someone else.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      // Check if target is already married
      const targetMarriage = await storage.getMarriage(targetUser.id);
      if (targetMarriage) {
        const embed = createErrorEmbed("User Already Married", "This user is already married to someone else!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      // Create proposal
      const embed = createBaseEmbed()
        .setTitle("💍 Marriage Proposal")
        .setDescription(`**${author.tag}** wants to marry **${targetUser.tag}**`);
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`marry_accept_${author.id}_${targetUser.id}`)
            .setLabel("Accept 💕")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`marry_decline_${author.id}_${targetUser.id}`)
            .setLabel("Decline 💔")
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.reply({ embeds: [embed], components: [row] });
    },
  },

  // Reset marry command (dev only)
  {
    data: new SlashCommandBuilder()
      .setName("resetmarry")
      .setDescription("Reset marriage system (dev only)")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to reset marriage for")
          .setRequired(true)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (interaction.user.id !== BOT_CONFIG.DEV_USER_ID) {
        const embed = createErrorEmbed("Unauthorized", "Only the developer can use this command.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const targetUser = interaction.options.getUser("user", true);
      
      const success = await storage.divorceMarriage(targetUser.id);
      
      if (success) {
        const embed = createSuccessEmbed("Marriage Reset", `Successfully reset marriage status for ${targetUser.tag}`);
        await interaction.reply({ embeds: [embed] });
      } else {
        const embed = createErrorEmbed("Reset Failed", "User was not married or reset failed.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },
];

export async function handleMarriageButtons(interaction: ButtonInteraction) {
  const { customId, user } = interaction;
  
  if (customId.startsWith("marry_accept_")) {
    const [, , proposerId, targetId] = customId.split("_");
    
    if (user.id !== targetId) {
      const embed = createErrorEmbed("Unauthorized", "Only the proposed user can accept this proposal.");
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    
    try {
      // Double-check both users are still single
      const proposerMarriage = await storage.getMarriage(proposerId);
      const targetMarriage = await storage.getMarriage(targetId);
      
      if (proposerMarriage || targetMarriage) {
        const embed = createErrorEmbed("Marriage Failed", "One of the users is already married!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      await storage.createMarriage({
        userId1: proposerId,
        userId2: targetId,
      });
      
      const proposer = await interaction.client.users.fetch(proposerId);
      const target = await interaction.client.users.fetch(targetId);
      
      const embed = createSuccessEmbed("💕 Marriage Successful!")
        .setDescription(`**${proposer.tag}** and **${target.tag}** are now married!`)
        .setTimestamp();
      
      await interaction.update({ embeds: [embed], components: [] });
    } catch (error) {
      const embed = createErrorEmbed("Marriage Failed", "An error occurred while processing the marriage.");
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
  
  else if (customId.startsWith("marry_decline_")) {
    const [, , proposerId, targetId] = customId.split("_");
    
    if (user.id !== targetId) {
      const embed = createErrorEmbed("Unauthorized", "Only the proposed user can decline this proposal.");
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    
    const proposer = await interaction.client.users.fetch(proposerId);
    const target = await interaction.client.users.fetch(targetId);
    
    const embed = createBaseEmbed()
      .setTitle("💔 Proposal Declined")
      .setDescription(`**${target.tag}** declined **${proposer.tag}**'s proposal.`);
    
    await interaction.update({ embeds: [embed], components: [] });
  }
  
  else if (customId.startsWith("divorce_")) {
    const [, userId] = customId.split("_");
    
    if (user.id !== userId) {
      const embed = createErrorEmbed("Unauthorized", "You can only divorce yourself.");
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    
    const success = await storage.divorceMarriage(userId);
    
    if (success) {
      const embed = createSuccessEmbed("💔 Divorced", "You are now divorced and free to marry someone else.");
      await interaction.update({ embeds: [embed], components: [] });
    } else {
      const embed = createErrorEmbed("Divorce Failed", "Could not process divorce. You may not be married.");
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}
