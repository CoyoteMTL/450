const { levelFromXP } = require('../utils/xp');

function isAFKChannel(guild, channelId, config) {
  if (!channelId) return false;

  if(guild.afkChannelId && channelId === guild.afkChannelId) return true;

  const extra = config.afkVoiceChannelIds ?? [];
  return Array.isArray(extra) && extra.includes(channelId);
}

function setupVoiceXp(client, dbApi, config) {
  const voiceSessions = new Map(); // key guildId:userId -> joinedAt ms
  client.voiceSessions = voiceSessions;
  const keyOf = (guildId, userId) => `${guildId}:${userId}`;

  function startSession(guildId, userId) {
    voiceSessions.set(keyOf(guildId, userId), Date.now());
  }

  function endSession(guild, userId) {
    const key = keyOf(guild.id, userId);
    const joinedAt = voiceSessions.get(key);
    if (!joinedAt) return;

    voiceSessions.delete(key);

    const seconds = Math.floor((Date.now() - joinedAt) / 1000);
    if (seconds < config.voiceMinSessionSeconds) return;

    // Ignore AFK si demandé
    if (config.ignoreAfkChannel && guild.afkChannelId) {
      const vs = guild.voiceStates.cache.get(userId);
      if (vs?.channelId === guild.afkChannelId) return;
    }

    const minutes = Math.floor(seconds / 60);
    const xpGain = minutes * config.voiceXpPerMinute;

    const before = dbApi.ensureUser(guild.id, userId);
    const oldLevel = levelFromXP(before.xp, config.xpPerLevelFactor);

    const updated = dbApi.addVoiceXP(guild.id, userId, Math.max(0, xpGain), seconds);
    const newLevel = levelFromXP(updated.xp, config.xpPerLevelFactor);

    if (config.announceLevelUp && newLevel > oldLevel) {
      const ch = guild.systemChannel;
      if (ch?.isTextBased?.()) {
        ch.send(`🎉 <@${userId}> a passé **niveau ${newLevel}** !`).catch(() => {});
      }
    }

  }

  client.on("voiceStateUpdate", (oldState, newState) => {
    const guild = newState.guild;
    const member = newState.member;
    if (!member || member.user.bot) return;

    const userId = member.id;
    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    // Join
    if (!oldChannelId && newChannelId) {
      startSession(guild.id, userId);
      return;
    }

    // Leave
    if (oldChannelId && !newChannelId) {
      endSession(guild, userId);
      return;
    }

    // Switch
    if (oldChannelId && newChannelId && oldChannelId !== newChannelId) {
      endSession(guild, userId);
      startSession(guild.id, userId);
    }
  });

  // Bonus: au démarrage, si déjà en vocal
  client.once("ready", () => {
    for (const guild of client.guilds.cache.values()) {
      for (const [userId, vs] of guild.voiceStates.cache) {
        if (vs.channelId && !vs.member?.user?.bot) {
          startSession(guild.id, userId);
        }
      }
    }
  });
}

module.exports = { setupVoiceXp };