const Database = require("better-sqlite3");

function createDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_stats (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      messages INTEGER NOT NULL DEFAULT 0,
      voice_seconds INTEGER NOT NULL DEFAULT 0,
      last_message_ts INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    levelup_channel_id TEXT
    );
    `);

  const stmtEnsure = db.prepare(`INSERT OR IGNORE INTO user_stats (guild_id, user_id) VALUES (?, ?)`);
  const stmtGet = db.prepare(`SELECT * FROM user_stats WHERE guild_id=? AND user_id=?`);

  const stmtAddMessage = db.prepare(`
    UPDATE user_stats
    SET xp = xp + ?,
        messages = messages + 1,
        last_message_ts = ?
    WHERE guild_id=? AND user_id=?;
  `);

  const stmtAddVoice = db.prepare(`
    UPDATE user_stats
    SET xp = xp + ?,
        voice_seconds = voice_seconds + ?
    WHERE guild_id=? AND user_id=?;
  `);

  const stmtAddXP = db.prepare(`
    UPDATE user_stats
    SET xp = xp + ?
    WHERE guild_id=? AND user_id=?;
    `);

  const stmtGetSettings = db.prepare(`
    SELECT levelup_channel_id
    FROM guild_settings
    WHERE guild_id = ?;
    `);

  const stmtSetLevelupChannel = db.prepare(`
    INSERT INTO guild_settings (guild_id, levelup_channel_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id)
    DO UPDATE SET levelup_channel_id = excluded.levelup_channel_id;
    `);

  function getLevelupChannel(guildId) {
    const row = stmtGetSettings.get(guildId);
    return row?.levelup_channel_id ?? null;
  }

  function setLevelupChannel(guildId, channelIdOrNull) {
    stmtSetLevelupChannel.run(guildId, channelIdOrNull);
  }

  function ensureUser(guildId, userId) {
    stmtEnsure.run(guildId, userId);
    return stmtGet.get(guildId, userId);
  }

  function getUser(guildId, userId) {
    return stmtGet.get(guildId, userId);
  }

  function addMessageXP(guildId, userId, xpGain, nowMs) {
    stmtAddMessage.run(xpGain, nowMs, guildId, userId);
    return stmtGet.get(guildId, userId);
  }

  function addVoiceXP(guildId, userId, xpGain, seconds) {
    stmtAddVoice.run(xpGain, seconds, guildId, userId);
    return stmtGet.get(guildId, userId);
  }

  function addXP(guildId, userId, amount) {
    stmtAddXP.run(amount, guildId, userId);
    return stmtGet.get(guildId, userId);
  }

  function getLeaderboard(guildId, field, limit, offset) {
    const allowed = new Set(["xp", "messages", "voice_seconds"]);
    const safeField = allowed.has(field) ? field : "xp";

    return db.prepare(`
      SELECT user_id, xp, messages, voice_seconds
      FROM user_stats
      WHERE guild_id = ?
      ORDER BY ${safeField} DESC
      LIMIT ? OFFSET ?;
    `).all(guildId, limit, offset);
  }

  return { 
    db,
    ensureUser,
    getUser,
    addMessageXP,
    addVoiceXP,
    addXP,
    getLeaderboard,
    getLevelupChannel,
    setLevelupChannel,
   };
}

module.exports = { createDb };