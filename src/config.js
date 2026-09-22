require("dotenv").config();

const CONFIG = {
  token: process.env.TOKEN,
  devGuildId: process.env.GUILD_ID || null,
  dbPath: process.env.DB_PATH || "xp.sqlite",

  // Messages
  msgCooldownMs: 25_000,
  msgXpMin: 5,
  msgXpMax: 15,

  // Bonus longueur (optionnel)
  lengthBonusEnabled: false,
  lengthBonusEveryChars: 25,
  lengthBonusMax: 10,

  // Vocal
  voiceXpPerMinute: 2,
  voiceMinSessionSeconds: 30,
  ignoreAfkChannel: true,

  // Niveaux
  xpPerLevelFactor: 100,
  announceLevelUp: true,
};

if (!CONFIG.token) {
  throw new Error("TOKEN manquant. Mets TOKEN=... dans ton fichier .env");
}

module.exports = { CONFIG };