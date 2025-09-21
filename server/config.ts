export const BOT_CONFIG = {
  TOKEN: process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || "",
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || "",
  DEV_USER_ID: "1327725098701946987",
  EMBED_COLOR: 0x000000, // Black color for embeds
  ANIME_API_URL: "https://api.waifu.pics/sfw",
  PERMISSIONS: {
    ADMIN_COMMANDS: ["BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_MESSAGES", "MUTE_MEMBERS"],
    CLEAR_MESSAGES: ["MANAGE_MESSAGES"],
  },
  MUTE_LIMITS: {
    MIN_SECONDS: 1,
    MAX_DAYS: 28,
  },
} as const;

export const ANIME_ACTIONS = {
  kiss: "kiss",
  hug: "hug", 
  kill: "kill",
  pat: "pat",
  slap: "slap",
} as const;

export type AnimeAction = keyof typeof ANIME_ACTIONS;
