import { EmbedBuilder } from "discord.js";
import { BOT_CONFIG } from "../config.js";

export function createBaseEmbed(title?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setTimestamp();
    
  if (title) {
    embed.setTitle(title);
  }
  
  return embed;
}

export function createUtilityEmbed(title: string): EmbedBuilder {
  return createBaseEmbed(title)
    .setFooter({ text: "created by lirolegal" });
}

export function createSuccessEmbed(title: string, description?: string): EmbedBuilder {
  const embed = createBaseEmbed(`✅ ${title}`);
  if (description) {
    embed.setDescription(description);
  }
  return embed;
}

export function createErrorEmbed(title: string, description?: string): EmbedBuilder {
  const embed = createBaseEmbed(`❌ ${title}`);
  if (description) {
    embed.setDescription(description);
  }
  return embed;
}

export function createLogEmbed(icon: string, title: string): EmbedBuilder {
  return createBaseEmbed(`${icon} ${title}`);
}
