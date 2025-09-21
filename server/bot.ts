import { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  Events, 
  REST, 
  Routes, 
  InteractionType
} from "discord.js";
import { BOT_CONFIG } from "./config.js";
import { adminCommands } from "./commands/admin.js";
import { roleplayCommands } from "./commands/roleplay.js";
import { utilityCommands, handleUserInfoButtons } from "./commands/utility.js";
import { marryCommands, handleMarriageButtons } from "./commands/marry.js";
import { setupCommands, handleSetupButtons, handleSetupModals, handleSetupSelects } from "./commands/setup.js";
import { handleQuickClear } from "./events/messageCreate.js";
import { setupLogging, setupMuteChecker } from "./events/logging.js";

interface BotCommand {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

export class GurizesBot {
  private client: Client;
  private commands: Collection<string, BotCommand>;
  
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites,
      ],
    });
    
    this.commands = new Collection();
    this.setupCommands();
    this.setupEvents();
  }
  
  private setupCommands() {
    const allCommands = [
      ...adminCommands,
      ...roleplayCommands,
      ...utilityCommands,
      ...marryCommands,
      ...setupCommands,
    ];
    
    for (const command of allCommands) {
      this.commands.set(command.data.name, command);
    }
  }
  
  private setupEvents() {
    this.client.once(Events.ClientReady, async (client) => {
      console.log(`Ready! Logged in as ${client.user.tag}`);
      
      // Deploy commands
      await this.deployCommands();
      
      // Setup logging and mute checker
      setupLogging(this.client);
      setupMuteChecker(this.client);
    });
    
    this.client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = this.commands.get(interaction.commandName);
          if (!command) return;
          
          await command.execute(interaction);
        }
        
        else if (interaction.isButton()) {
          if (interaction.customId.startsWith("userinfo_")) {
            await handleUserInfoButtons(interaction);
          }
          else if (interaction.customId.startsWith("marry_") || interaction.customId.startsWith("divorce_")) {
            await handleMarriageButtons(interaction);
          }
          else if (interaction.customId.startsWith("setup_")) {
            await handleSetupButtons(interaction);
          }
        }
        
        else if (interaction.isModalSubmit()) {
          if (interaction.customId.startsWith("setup_")) {
            await handleSetupModals(interaction);
          }
        }
        
        else if (interaction.isStringSelectMenu()) {
          if (interaction.customId.startsWith("setup_")) {
            await handleSetupSelects(interaction);
          }
        }
      } catch (error) {
        console.error("Interaction error:", error);
        
        if (interaction.isRepliable()) {
          const content = "An error occurred while processing this interaction.";
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, ephemeral: true });
          } else {
            await interaction.reply({ content, ephemeral: true });
          }
        }
      }
    });
    
    this.client.on(Events.MessageCreate, async (message) => {
      try {
        await handleQuickClear(message);
      } catch (error) {
        console.error("Message handler error:", error);
      }
    });
    
    this.client.on(Events.Error, (error) => {
      console.error("Discord client error:", error);
    });
  }
  
  private async deployCommands() {
    try {
      const rest = new REST().setToken(BOT_CONFIG.TOKEN);
      
      const commandData = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
      
      console.log(`Started refreshing ${commandData.length} application (/) commands.`);
      
      await rest.put(
        Routes.applicationCommands(BOT_CONFIG.CLIENT_ID),
        { body: commandData }
      );
      
      console.log(`Successfully reloaded ${commandData.length} application (/) commands.`);
    } catch (error) {
      console.error("Failed to deploy commands:", error);
    }
  }
  
  async start() {
    if (!BOT_CONFIG.TOKEN) {
      throw new Error("DISCORD_TOKEN environment variable is required");
    }
    
    if (!BOT_CONFIG.CLIENT_ID) {
      throw new Error("DISCORD_CLIENT_ID environment variable is required");
    }
    
    await this.client.login(BOT_CONFIG.TOKEN);
  }
  
  async stop() {
    this.client.destroy();
  }
  
  getClient() {
    return this.client;
  }
}
