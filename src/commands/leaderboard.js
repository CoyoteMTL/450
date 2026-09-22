const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,

} = require ('discord.js');
const { formatDuration } = require("../utils/xp");

const PAGE_SIZE = 10;
const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };
const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Voir le classement.")
  .addStringOption((opt) =>
    opt
      .setName("type")
      .setDescription("Type de classement")
      .setRequired(false)
      .addChoices(
        { name: "XP", value: "xp" },
        { name: "Messages", value: "messages" },
        { name: "Vocal (temps)", value: "voice_seconds" }
      )
  )
  .addIntegerOption((opt) => opt.setName("page").setDescription("Page (1 = top)").setRequired(false));

async function buildPage(interaction, db, type, page) {
  const offset = (page - 1) * PAGE_SIZE;
  const rows = db.getLeaderboard(interaction.guild.id, type, PAGE_SIZE + 1, offset);
  const hasNextPage = rows.length > PAGE_SIZE;
  const pageRows = rows.slice(0, PAGE_SIZE);

  if (!pageRows.length) return { embed: null, hasNextPage: false, isEmpty: true };

  const lines = await Promise.all(
    pageRows.map(async (row, index) => {
      const rank = offset + index + 1;
      const medal = MEDALS[rank];
      const label = medal ? medal : `**#${rank}**`;

      const member =
      interaction.guild.members.cache.get(row.user_id) ||
        (await interaction.guild.members.fetch(row.user_id).catch(() => null));
      const name = member ? member.displayName : `<@${row.user_id}>`;

      if (type === 'messages') return `${label} ${name} — **${row.messages}** messages (XP: ${row.xp})`;
      if (type === 'voice_seconds')
        return `${label} ${name} — **${formatDuration(row.voice_seconds)}** (XP: ${row.xp})`;

      return `${label} ${name} — **${row.xp}** XP (Messages: ${row.messages}, Vocal: ${formatDuration(row.voice_seconds)})`;
    })
  );

  const embed = new EmbedBuilder()
  .setTitle(`🏆 Leaderboard (${type}) — page ${page}`)
  .setDescription(lines.join("\n"))

  return { embed, hasNextPage, isEmpty: false };
}

function buildRow(page, hasNextPage) {
  const prevButton = new ButtonBuilder()
    .setCustomId(`leaderboard_prev_${page}`)
    .setLabel("⬅️ Précédent")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 1);

  const nextButton = new ButtonBuilder()
    .setCustomId(`leaderboard_next_${page}`)
    .setLabel("➡️ Suivant")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(!hasNextPage);

  return new ActionRowBuilder().addComponents(prevButton, nextButton);
}

async function execute(interaction, ctx) {
  const type = interaction.options.getString("type") || "xp";
  let page = Math.max(1, interaction.options.getInteger("page") || 1);

  const { embed, hasNextPage, isEmpty } = await buildPage(interaction, ctx.db, type, page);

  if (isEmpty) {
    await interaction.reply({ content: "❌ Aucun classement disponible", ephemeral: true });
    return;
  }

  const row = buildRow(page, hasNextPage);
  const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000,
  });

  collector.on('collect', async (buttonInteraction) => {
    if (buttonInteraction.user.id !== interaction.user.id) {
      await buttonInteraction.reply({
        content: "❌ Tu ne peux pas interagir avec ce bouton.",
        ephemeral: true 
      });
      return;
    }

    let nextPage = page;
    if (buttonInteraction.customId === `leaderboard_prev_${page}`) nextPage = Math.max(1, page -1);
    if (buttonInteraction.customId === `leaderboard_next_${page}`) nextPage = page + 1;

    const next = await buildPage(interaction, ctx.db, type, nextPage);
    if (next.isEmpty) {
      await buttonInteraction.deferUpdate().catch(() => {});
      return;
    }

    page = nextPage;

    await buttonInteraction.update({
      embeds: [next.embed],
      components: [buildRow(page, next.hasNextPage)],
    });
  });

  collector.on('end', async () => {
    const currentRow = message.components[0];
    if (!currentRow) return;

    const disabledRow = new ActionRowBuilder().addComponents(
      currentRow.components.map((components) => ButtonBuilder.from(components).setDisabled(true))
    );
    await message.edit({ components: [disabledRow] }).catch(() => {});
  });
}




module.exports = { data, execute };