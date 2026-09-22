const { levelFromXP, randInt } = require("../utils/xp");

function setupMessageXp(client, dbApi, config) {
  client.on("messageCreate", async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    const row = dbApi.ensureUser(guildId, userId);
    const now = Date.now();

    if (now - (row.last_message_ts || 0) < config.msgCooldownMs) return;

    let xpGain = randInt(config.msgXpMin, config.msgXpMax);

    if (config.lengthBonusEnabled && typeof message.content === "string") {
      const len = message.content.trim().length;
      const bonus = Math.min(config.lengthBonusMax, Math.floor(len / config.lengthBonusEveryChars));
      xpGain += Math.max(0, bonus);
    }

    const oldLevel = levelFromXP(row.xp, config.xpPerLevelFactor);
    const updated = dbApi.addMessageXP(guildId, userId, xpGain, now);
    const newLevel = levelFromXP(updated.xp, config.xpPerLevelFactor);

  if (config.announceLevelUp && newLevel > oldLevel) {
  let target = message.channel;

  const configuredId = dbApi.getLevelupChannel(guildId);
  if (configuredId) {
    const ch =
      message.guild.channels.cache.get(configuredId) ||
      (await message.guild.channels.fetch(configuredId).catch(() => null));

    if (ch?.isTextBased?.()) target = ch;
  }

  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    target
      .send(`🎉 ${message.author} a passé **niveau ${lvl}** !`)
      .catch(() => {});
  }
}
  });
}

module.exports = { setupMessageXp };