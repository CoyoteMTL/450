const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xp-channel")
    .setDescription("Configurer le salon des annonces de level-up")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("set")
        .setDescription("Choisir le salon des annonces")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Salon où envoyer les level-up")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("disable").setDescription("Désactiver les annonces")
    )
    .addSubcommand((s) =>
      s.setName("show").setDescription("Afficher la config")
    ),

  async execute(interaction, ctx) {
    const sub = interaction.options.getSubcommand();
    const gid = interaction.guildId;

    if (sub === "set") {
      const ch = interaction.options.getChannel("channel", true);
      ctx.db.setLevelupChannel(gid, ch.id);
      return interaction.reply({
        content: `✅ Les annonces de level-up seront envoyées dans ${ch}.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "disable") {
      ctx.db.setLevelupChannel(gid, null);
      return interaction.reply({
        content: `✅ Annonces de level-up désactivées.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const id = ctx.db.getLevelupChannel(gid);
    return interaction.reply({
      content: id ? `📣 Salon level-up: <#${id}>` : `ℹ️ Aucun salon configuré.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};