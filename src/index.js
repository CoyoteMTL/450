const { Client, GatewayIntentBits } = require("discord.js");
const { CONFIG } = require("./config");
const { createDb } = require("./db");

const { setupMessageXp } = require("./listeners/messageXp");
const { setupVoiceXp } = require("./listeners/voiceXp");

const rank = require("./commands/rank");
const leaderboard = require("./commands/leaderboard");
const { registerCommands } = require("./commands/register");

const ping = require("./commands/ping");
const annonce = require(`./commands/annonce`);
const xpChannel = require('./commands/xpChannel');
const addxp = require(`./commands/addxp`);
const avatar = require('./commands/avatar');
const mute = require('./commands/mute');
const unmute = require('./commands/unmute');


const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildMembers,
];


const client = new Client({ intents });

const db = createDb(CONFIG.dbPath);

const commands = [rank, leaderboard, ping, xpChannel, addxp, annonce, avatar, mute, unmute];
const commandsJson = commands.map((c) => c.data.toJSON());

// Listeners XP
setupMessageXp(client, db, CONFIG);
setupVoiceXp(client, db, CONFIG);

// Slash commands + routing
client.once("ready", async () => {
  console.log(`✅ Connecté: ${client.user.tag}`);
  console.log(`📦 DB: ${CONFIG.dbPath}`);

  try {
    await registerCommands(client, CONFIG, commandsJson);
  } catch (e) {
    console.error("❌ Erreur en enregistrant les commandes:", e);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return;

  const cmd = commands.find((c) => c.data.name === interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction, { db, config: CONFIG });
  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) {
      interaction.followUp({ content: "❌ Erreur interne.", ephemeral: true }).catch(() => {});
    } else {
      interaction.reply({ content: "❌ Erreur interne.", ephemeral: true }).catch(() => {});
    }
  }
  
});

client.login(CONFIG.token);