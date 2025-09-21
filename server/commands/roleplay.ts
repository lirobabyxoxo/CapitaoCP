import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createBaseEmbed, createErrorEmbed } from "../utils/embedBuilder.js";
import { BOT_CONFIG, ANIME_ACTIONS, type AnimeAction } from "../config.js";

async function getAnimeGif(action: AnimeAction): Promise<string | null> {
  try {
    const response = await fetch(`${BOT_CONFIG.ANIME_API_URL}/${action}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error(`Failed to fetch ${action} GIF:`, error);
    return null;
  }
}

export const roleplayCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("kiss")
      .setDescription("Kiss someone")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to kiss")
          .setRequired(true)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user", true);
      const author = interaction.user;
      
      if (targetUser.id === author.id) {
        const embed = createErrorEmbed("Invalid Target", "You cannot kiss yourself!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const gifUrl = await getAnimeGif("kiss");
      
      const embed = createBaseEmbed()
        .setDescription(`**${author.displayName}** kisses **${targetUser.displayName}**`);
      
      if (gifUrl) {
        embed.setImage(gifUrl);
      }
      
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("hug")
      .setDescription("Hug someone")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to hug")
          .setRequired(true)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user", true);
      const author = interaction.user;
      
      if (targetUser.id === author.id) {
        const embed = createErrorEmbed("Invalid Target", "You cannot hug yourself!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const gifUrl = await getAnimeGif("hug");
      
      const embed = createBaseEmbed()
        .setDescription(`**${author.displayName}** hugs **${targetUser.displayName}**`);
      
      if (gifUrl) {
        embed.setImage(gifUrl);
      }
      
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("kill")
      .setDescription("Kill someone (roleplay)")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to kill")
          .setRequired(true)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user", true);
      const author = interaction.user;
      
      if (targetUser.id === author.id) {
        const embed = createErrorEmbed("Invalid Target", "You cannot kill yourself!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const gifUrl = await getAnimeGif("kill");
      
      const embed = createBaseEmbed()
        .setDescription(`**${author.displayName}** kills **${targetUser.displayName}**`);
      
      if (gifUrl) {
        embed.setImage(gifUrl);
      }
      
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("pat")
      .setDescription("Pat someone")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to pat")
          .setRequired(true)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user", true);
      const author = interaction.user;
      
      if (targetUser.id === author.id) {
        const embed = createErrorEmbed("Invalid Target", "You cannot pat yourself!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const gifUrl = await getAnimeGif("pat");
      
      const embed = createBaseEmbed()
        .setDescription(`**${author.displayName}** pats **${targetUser.displayName}**`);
      
      if (gifUrl) {
        embed.setImage(gifUrl);
      }
      
      await interaction.reply({ embeds: [embed] });
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("slap")
      .setDescription("Slap someone")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to slap")
          .setRequired(true)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user", true);
      const author = interaction.user;
      
      if (targetUser.id === author.id) {
        const embed = createErrorEmbed("Invalid Target", "You cannot slap yourself!");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const gifUrl = await getAnimeGif("slap");
      
      const embed = createBaseEmbed()
        .setDescription(`**${author.displayName}** slaps **${targetUser.displayName}**`);
      
      if (gifUrl) {
        embed.setImage(gifUrl);
      }
      
      await interaction.reply({ embeds: [embed] });
    },
  },
];
