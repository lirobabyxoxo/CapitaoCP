import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionFlagsBits,
  GuildMember,
  ButtonInteraction,
  ComponentType
} from "discord.js";
import { createUtilityEmbed, createErrorEmbed, createSuccessEmbed } from "../utils/embedBuilder.js";
import { storage } from "../storage.js";

export const utilityCommands = [
  // Avatar command
  {
    data: new SlashCommandBuilder()
      .setName("av")
      .setDescription("Show user's avatar")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to show avatar for")
          .setRequired(false)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      
      const embed = createUtilityEmbed("Avatar")
        .setAuthor({ 
          name: `${targetUser.tag}`, 
          iconURL: targetUser.displayAvatarURL({ size: 64 }) 
        })
        .setImage(targetUser.displayAvatarURL({ size: 512 }));
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setLabel("Download PNG")
            .setStyle(ButtonStyle.Link)
            .setURL(targetUser.displayAvatarURL({ extension: "png", size: 512 })),
          new ButtonBuilder()
            .setLabel("Download JPG")
            .setStyle(ButtonStyle.Link)
            .setURL(targetUser.displayAvatarURL({ extension: "jpg", size: 512 }))
        );
      
      await interaction.reply({ embeds: [embed], components: [row] });
    },
  },

  // UserInfo command
  {
    data: new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("Show detailed user information")
      .addUserOption(option =>
        option.setName("user")
          .setDescription("User to show info for")
          .setRequired(false)),
    
    async execute(interaction: ChatInputCommandInteraction) {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const member = interaction.guild?.members.cache.get(targetUser.id);
      
      const embed = createUtilityEmbed("Member Information")
        .setAuthor({ 
          name: `${targetUser.tag}`, 
          iconURL: targetUser.displayAvatarURL({ size: 64 }) 
        })
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: "User ID", value: `\`${targetUser.id}\``, inline: true },
          { name: "Account Created", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>`, inline: true },
          { name: "Status", value: member?.presence?.status || "Unknown", inline: true }
        );
      
      if (member) {
        embed.addFields(
          { name: "Joined Server", value: `<t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:D>`, inline: true },
          { name: "Roles", value: member.roles.cache.size > 1 ? 
            member.roles.cache.filter(r => r.id !== interaction.guild?.id).map(r => r.name).join(", ") : 
            "None", inline: false }
        );
      }
      
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`userinfo_names_${targetUser.id}`)
            .setLabel("Previous Names")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`userinfo_avatars_${targetUser.id}`)
            .setLabel("Old Avatars")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`userinfo_badges_${targetUser.id}`)
            .setLabel("Badges")
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.reply({ embeds: [embed], components: [row] });
    },
  },

  // Clear command
  {
    data: new SlashCommandBuilder()
      .setName("clear")
      .setDescription("Clear messages from channel")
      .addIntegerOption(option =>
        option.setName("amount")
          .setDescription("Number of messages to clear (1-100)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild || !interaction.channel) return;
      
      const amount = interaction.options.getInteger("amount", true);
      
      try {
        if (interaction.channel.type !== 0) { // TEXT_CHANNEL
          const embed = createErrorEmbed("Invalid Channel", "This command can only be used in text channels.");
          await interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
        
        const messages = await interaction.channel.bulkDelete(amount, true);
        
        const embed = createSuccessEmbed("Messages Cleared")
          .addFields(
            { name: "Amount", value: `${messages.size} messages`, inline: true },
            { name: "Channel", value: `<#${interaction.channel.id}>`, inline: true },
            { name: "Staff", value: interaction.user.tag, inline: true }
          );
        
        const reply = await interaction.reply({ embeds: [embed] });
        
        // Auto-delete the confirmation after 5 seconds
        setTimeout(async () => {
          try {
            await reply.delete();
          } catch (error) {
            // Ignore deletion errors
          }
        }, 5000);
      } catch (error) {
        const embed = createErrorEmbed("Clear Failed", "Could not clear messages. Messages may be too old or an error occurred.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    },
  },
];

// Button interaction handler for userinfo navigation
export async function handleUserInfoButtons(interaction: ButtonInteraction) {
  if (!interaction.customId.startsWith("userinfo_")) return;
  
  const [, action, userId] = interaction.customId.split("_");
  
  try {
    const user = await interaction.client.users.fetch(userId);
    
    switch (action) {
      case "names":
        const namesEmbed = createUtilityEmbed("Previous Names")
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 64 }) })
          .setDescription("Previous names feature is not implemented yet.\nThis would show username history.");
        await interaction.reply({ embeds: [namesEmbed], ephemeral: true });
        break;
        
      case "avatars":
        const avatarsEmbed = createUtilityEmbed("Old Avatars")
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 64 }) })
          .setDescription("Old avatars feature is not implemented yet.\nThis would show avatar history.");
        await interaction.reply({ embeds: [avatarsEmbed], ephemeral: true });
        break;
        
      case "badges":
        const badgesEmbed = createUtilityEmbed("User Badges")
          .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 64 }) })
          .setDescription("Badges feature is not implemented yet.\nThis would show user badges and achievements.");
        await interaction.reply({ embeds: [badgesEmbed], ephemeral: true });
        break;
    }
  } catch (error) {
    const embed = createErrorEmbed("Error", "Could not fetch user information.");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
