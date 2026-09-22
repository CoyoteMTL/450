const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Tester si le bot répond.");

async function execute(interaction) {
  // Ping websocket Discord (latence de la connexion)
  const wsPing = interaction.client.ws.ping;
  await interaction.reply(`🏓 Pong! (WS: ${wsPing}ms)`);
}

module.exports = { data, execute };