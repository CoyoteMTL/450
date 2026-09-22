async function registerCommands(client, config, commandsJson) {
  if (config.devGuildId) {
    const guild = await client.guilds.fetch(config.devGuildId);
    await guild.commands.set(commandsJson);
    console.log(`🛠️ Slash commands enregistrées sur DEV guild: ${guild.name}`);
  } else {
    await client.application.commands.set(commandsJson);
    console.log("🌍 Slash commands enregistrées globalement (peut prendre du temps à apparaître).");
  }
}

module.exports = { registerCommands };