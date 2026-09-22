const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { levelFromXP, xpForNextLevel, formatDuration } = require("../utils/xp");

const data = new SlashCommandBuilder()
  .setName("rank")
  .setDescription("Voir ton niveau/XP (ou celui de quelqu’un).")
  .addUserOption((opt) => opt.setName("user").setDescription("Utilisateur").setRequired(false));

async function execute(interaction, ctx) {
  const user = interaction.options.getUser("user") || interaction.user;
  ctx.db.ensureUser(interaction.guild.id, user.id);

  const row = ctx.db.getUser(interaction.guild.id, user.id);

  const key = `${interaction.guild.id}:${user.id}`;
  const joinedAt = interaction.client.voiceSessions?.get(key);
  const liveSeconds = joinedAt ? Math.floor((Date.now() - joinedAt) / 1000) : 0;
  const totalVoiceSeconds = row.voice_seconds + liveSeconds;

  const level = levelFromXP(row.xp, ctx.config.xpPerLevelFactor);
  const nextXP = xpForNextLevel(level, ctx.config.xpPerLevelFactor);

  const embed = new EmbedBuilder()
    .setTitle(`📊 Rank — ${user.username}`)
    .addFields(
      { name: "Niveau", value: `${level}`, inline: true },
      { name: "XP", value: `${row.xp} / ${nextXP}`, inline: true },
      { name: "Messages", value: `${row.messages}`, inline: true },
      { name: "Temps vocal", value: formatDuration(totalVoiceSeconds) + (joinedAt ? " *(en cours)*" : ""), inline: true }
    );

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };