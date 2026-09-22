const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

const { levelFromXP, xpForNextLevel } = require("../utils/xp");

const data = new SlashCommandBuilder()
  .setName("addxp")
  .setDescription("Ajouter de l'XP à un joueur (admin).")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addUserOption((opt) =>
    opt.setName("user").setDescription("Joueur").setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt
      .setName("amount")
      .setDescription("Quantité d'XP à ajouter")
      .setRequired(true)
      .setMinValue(1)
  )
  .addBooleanOption((opt) =>
    opt
      .setName("announce")
      .setDescription("Annoncer publiquement si ça fait level up (optionnel)")
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName("reason")
      .setDescription("Raison (optionnel)")
      .setRequired(false)
  );

async function execute(interaction, ctx) {
  const user = interaction.options.getUser("user", true);
  const amount = interaction.options.getInteger("amount", true);
  const announce = interaction.options.getBoolean("announce") ?? false;
  const reason = interaction.options.getString("reason") ?? null;

  const gid = interaction.guild.id;

  const before = ctx.db.ensureUser(gid, user.id);
  const oldLevel = levelFromXP(before.xp, ctx.config.xpPerLevelFactor);

  const updated = ctx.db.addXP(gid, user.id, amount);
  const newLevel = levelFromXP(updated.xp, ctx.config.xpPerLevelFactor);
  const nextXP = xpForNextLevel(newLevel, ctx.config.xpPerLevelFactor);

  const embed = new EmbedBuilder()
    .setTitle("✅ XP ajouté")
    .addFields(
      { name: "Utilisateur", value: `${user}`, inline: true },
      { name: "Ajout", value: `+${amount} XP`, inline: true },
      { name: "Niveau", value: `${oldLevel} → ${newLevel}`, inline: true },
      { name: "XP total", value: `${updated.xp} / ${nextXP}`, inline: true }
    );

  if (reason) embed.addFields({ name: "Raison", value: reason });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });

  if (announce && ctx.config.announceLevelUp && newLevel > oldLevel) {
  let target = interaction.channel;

  const channelId = ctx.db.getLevelupChannel(interaction.guildId);
  if (channelId) {
    const ch = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (ch?.isTextBased?.()) target = ch;
  }

  if (newLevel === oldLevel + 1) {
    target.send(`🎉 ${user} a passé **niveau ${newLevel}** !`).catch(() => {});
  } else {
    target
      .send(`🚀 ${user} est passé du **niveau ${oldLevel}** au **niveau ${newLevel}** (+${newLevel - oldLevel}).`)
      .catch(() => {});
  }
}
}

module.exports = { data, execute };