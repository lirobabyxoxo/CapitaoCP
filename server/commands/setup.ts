import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ChannelType
} from "discord.js";
import { createBaseEmbed, createSuccessEmbed, createErrorEmbed } from "../utils/embedBuilder.js";
import { storage } from "../storage.js";

export const setupCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Configure bot settings for this server")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild) return;
      
      const config = await storage.getServerConfig(interaction.guild.id);
      
      const embed = createBaseEmbed()
        .setTitle("⚙️ Clear System Setup")
        .setDescription("Configure the quick clear system settings")
        .addFields(
          { 
            name: "System Status", 
            value: config?.clearSystemEnabled ? "✅ Enabled" : "❌ Disabled", 
            inline: true 
          },
          { 
            name: "Trigger Message", 
            value: `\`${config?.clearTrigger || ".cl"}\``, 
            inline: true 
          },
          { 
            name: "Authorized Roles", 
            value: config?.clearRoles?.length ? 
              config.clearRoles.map(id => `<@&${id}>`).join(", ") : 
              "None", 
            inline: false 
          },
          { 
            name: "Authorized Users", 
            value: config?.clearUsers?.length ? 
              config.clearUsers.map(id => `<@${id}>`).join(", ") : 
              "None", 
            inline: false 
          }
        );
      
      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`setup_toggle_${interaction.guild.id}`)
            .setLabel(config?.clearSystemEnabled ? "Disable System" : "Enable System")
            .setStyle(config?.clearSystemEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`setup_trigger_${interaction.guild.id}`)
            .setLabel("Change Trigger")
            .setStyle(ButtonStyle.Secondary)
        );
      
      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`setup_roles_${interaction.guild.id}`)
            .setLabel("Configure Roles")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`setup_users_${interaction.guild.id}`)
            .setLabel("Configure Users")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`setup_logs_${interaction.guild.id}`)
            .setLabel("Setup Logs")
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.reply({ embeds: [embed], components: [row1, row2] });
    },
  },
];

export async function handleSetupButtons(interaction: ButtonInteraction) {
  const { customId, guild } = interaction;
  if (!guild) return;
  
  const [, action, guildId] = customId.split("_");
  
  if (guildId !== guild.id) return;
  
  switch (action) {
    case "toggle":
      const config = await storage.getServerConfig(guild.id);
      const newStatus = !config?.clearSystemEnabled;
      
      await storage.updateServerConfig(guild.id, {
        guildId: guild.id,
        clearSystemEnabled: newStatus,
      });
      
      const embed = createSuccessEmbed(
        "System Updated", 
        `Clear system has been ${newStatus ? "enabled" : "disabled"}.`
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      break;
      
    case "trigger":
      const triggerModal = new ModalBuilder()
        .setCustomId(`setup_trigger_modal_${guild.id}`)
        .setTitle("Change Trigger Message");
      
      const triggerInput = new TextInputBuilder()
        .setCustomId("trigger")
        .setLabel("New Trigger Message")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(".cl")
        .setRequired(true)
        .setMaxLength(10);
      
      const triggerRow = new ActionRowBuilder<TextInputBuilder>().addComponents(triggerInput);
      triggerModal.addComponents(triggerRow);
      
      await interaction.showModal(triggerModal);
      break;
      
    case "roles":
      const roles = guild.roles.cache
        .filter(role => role.id !== guild.id && !role.managed)
        .map(role => ({
          label: role.name,
          value: role.id,
          description: `Members: ${role.members.size}`,
        }))
        .slice(0, 25); // Discord limit
      
      if (roles.length === 0) {
        const embed = createErrorEmbed("No Roles", "No suitable roles found to configure.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const roleSelect = new StringSelectMenuBuilder()
        .setCustomId(`setup_role_select_${guild.id}`)
        .setPlaceholder("Select roles that can use the clear system")
        .setMinValues(0)
        .setMaxValues(Math.min(roles.length, 10))
        .addOptions(roles);
      
      const roleRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelect);
      
      const roleEmbed = createBaseEmbed("Configure Roles")
        .setDescription("Select which roles can use the quick clear system:");
      
      await interaction.reply({ embeds: [roleEmbed], components: [roleRow], ephemeral: true });
      break;
      
    case "users":
      const userModal = new ModalBuilder()
        .setCustomId(`setup_users_modal_${guild.id}`)
        .setTitle("Configure Authorized Users");
      
      const userInput = new TextInputBuilder()
        .setCustomId("users")
        .setLabel("User IDs (comma separated)")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("123456789012345678, 987654321098765432")
        .setRequired(false);
      
      const userRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userInput);
      userModal.addComponents(userRow);
      
      await interaction.showModal(userModal);
      break;
      
    case "logs":
      const channels = guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildText)
        .map(channel => ({
          label: channel.name,
          value: channel.id,
          description: `Category: ${channel.parent?.name || "None"}`,
        }))
        .slice(0, 25);
      
      if (channels.length === 0) {
        const embed = createErrorEmbed("No Channels", "No text channels found to configure.");
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      const logSelect = new StringSelectMenuBuilder()
        .setCustomId(`setup_log_select_${guild.id}`)
        .setPlaceholder("Select channels for logging")
        .setMinValues(0)
        .setMaxValues(3)
        .addOptions([
          {
            label: "Message Logs",
            value: "messages",
            description: "Message edits and deletions",
          },
          {
            label: "Member Logs", 
            value: "members",
            description: "Nickname and avatar changes",
          },
          {
            label: "Server Logs",
            value: "server", 
            description: "Channel/role creation, invites",
          },
        ]);
      
      const logRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(logSelect);
      
      const logEmbed = createBaseEmbed("Setup Logging")
        .setDescription("Select which types of logs to enable:");
      
      await interaction.reply({ embeds: [logEmbed], components: [logRow], ephemeral: true });
      break;
  }
}

export async function handleSetupModals(interaction: ModalSubmitInteraction) {
  const { customId, guild } = interaction;
  if (!guild) return;
  
  if (customId.startsWith("setup_trigger_modal_")) {
    const trigger = interaction.fields.getTextInputValue("trigger");
    
    await storage.updateServerConfig(guild.id, {
      guildId: guild.id,
      clearTrigger: trigger,
    });
    
    const embed = createSuccessEmbed("Trigger Updated", `Clear trigger has been set to \`${trigger}\``);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  else if (customId.startsWith("setup_users_modal_")) {
    const usersInput = interaction.fields.getTextInputValue("users");
    const userIds = usersInput
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0 && /^\d{17,19}$/.test(id));
    
    await storage.updateServerConfig(guild.id, {
      guildId: guild.id,
      clearUsers: userIds,
    });
    
    const embed = createSuccessEmbed("Users Updated", `Authorized ${userIds.length} users for clear system.`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export async function handleSetupSelects(interaction: StringSelectMenuInteraction) {
  const { customId, guild, values } = interaction;
  if (!guild) return;
  
  if (customId.startsWith("setup_role_select_")) {
    await storage.updateServerConfig(guild.id, {
      guildId: guild.id,
      clearRoles: values,
    });
    
    const embed = createSuccessEmbed("Roles Updated", `Authorized ${values.length} roles for clear system.`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  else if (customId.startsWith("setup_log_select_")) {
    const logChannels: Record<string, string> = {};
    
    // For simplicity, we'll use the first text channel for all selected log types
    const firstTextChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText);
    
    if (firstTextChannel) {
      values.forEach(logType => {
        logChannels[logType] = firstTextChannel.id;
      });
    }
    
    await storage.updateServerConfig(guild.id, {
      guildId: guild.id,
      logChannels,
    });
    
    const embed = createSuccessEmbed("Logs Updated", `Configured ${values.length} log types.`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
