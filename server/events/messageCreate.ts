import { Message, PermissionFlagsBits, ChannelType } from "discord.js";
import { storage } from "../storage.js";
import { createSuccessEmbed, createErrorEmbed } from "../utils/embedBuilder.js";

export async function handleQuickClear(message: Message) {
  if (!message.guild || message.author.bot) return;
  
  const config = await storage.getServerConfig(message.guild.id);
  
  // Check if clear system is enabled and message matches trigger
  if (!config?.clearSystemEnabled || message.content !== config.clearTrigger) {
    return;
  }
  
  // Check if user has permission
  const member = message.member;
  if (!member) return;
  
  let hasPermission = false;
  
  // Check if user is in authorized users list
  if (config.clearUsers?.includes(member.id)) {
    hasPermission = true;
  }
  
  // Check if user has authorized role
  if (config.clearRoles?.some(roleId => member.roles.cache.has(roleId))) {
    hasPermission = true;
  }
  
  // Check if user has manage messages permission
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    hasPermission = true;
  }
  
  if (!hasPermission) {
    return; // Silently ignore unauthorized users
  }
  
  // Perform quick clear
  try {
    if (message.channel.type !== ChannelType.GuildText) {
      return;
    }
    
    // Delete the trigger message first
    await message.delete();
    
    // Clear 100 messages
    const messages = await message.channel.bulkDelete(100, true);
    
    const embed = createSuccessEmbed("Messages Cleared")
      .addFields(
        { name: "Amount", value: `${messages.size} messages`, inline: true },
        { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
        { name: "Staff", value: message.author.tag, inline: true }
      );
    
    const reply = await message.channel.send({ embeds: [embed] });
    
    // Auto-delete the confirmation after 5 seconds
    setTimeout(async () => {
      try {
        await reply.delete();
      } catch (error) {
        // Ignore deletion errors
      }
    }, 5000);
    
  } catch (error) {
    console.error("Quick clear failed:", error);
    
    const embed = createErrorEmbed("Clear Failed", "Could not clear messages. Messages may be too old or an error occurred.");
    
    try {
      if ('send' in message.channel) {
        const reply = await message.channel.send({ embeds: [embed] });
        setTimeout(async () => {
          try {
            await reply.delete();
          } catch (error) {
            // Ignore deletion errors
          }
        }, 5000);
      }
    } catch (error) {
      // Ignore if we can't send the error message
    }
  }
}
