const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("annonce")
    .setDescription("Envoyer une annonce dans un salon.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("salon")
        .setDescription("Salon où envoyer l'annonce")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Contenu de l'annonce")
        .setRequired(true)
    ),

  async execute(interaction) {
    const salon = interaction.options.getChannel("salon", true);
    const message = interaction.options.getString("message", true);

    // Discord limite un message texte à 2000 caractères
    if (message.length > 2000) {
      return interaction.reply({
        content: `❌ Ton message fait ${message.length} caractères (max 2000).`,
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await salon.send({
        content: message,
        // ✅ évite @everyone / @here (mais permet mentions users/roles si tu veux)
        allowedMentions: { parse: ["users", "roles"] },
      });

      return interaction.reply({
        content: `✅ Annonce envoyée dans ${salon}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      console.error(e);
      return interaction.reply({
        content: `❌ Impossible d'envoyer l'annonce dans ${salon} (permissions?).`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};