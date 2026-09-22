const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Afficher l'avatar d'un membre du serveur ou d'un utilisateur Discord")
    .addUserOption((opt) =>
        opt
            .setName('user')
            .setDescription("Membre dont tu veux voir l'avatar")
            .setRequired(false)
    )
    .addStringOption((opt) =>
        opt
            .setName('id')
            .setDescription('ID Discord de l’utilisateur')
            .setRequired(false)
    );

async function execute(interaction) {
    const selectedUser = interaction.options.getUser('user');
    const userId = interaction.options.getString('id', false);

    if (selectedUser && userId) {
        return interaction.reply({
            content: "❌ Utilise soit `user`, soit `id`, pas les deux.",
            ephemeral: true,
        });
    }

    if (!selectedUser && !userId) {
        return interaction.reply({
            content: "❌ Tu dois fournir un membre avec `user` ou un ID avec `id`.",
            ephemeral: true,
        });
    }
    let user;

    if (selectedUser) {
        user = selectedUser;
    } else if (userId) {}

    if (userId) {
        if (!/^\d{17,20}$/.test(userId)) {
            return interaction.reply({
                content: "❌ L'ID Discord fourni n'est pas valide.",
                ephemeral: true,
            });
        }

        try {
            user = await interaction.client.users.fetch(userId);
            } catch (error) {
                console.error('Erreur lors de la récupération de lutilisateur :', error);

                return interaction.reply({
                    content: "❌ Impossible de récupérer l'utilisateur avec cet ID.",
                    ephemeral: true,
                });
            }
        }

        const avatarURL = user.displayAvatarURL({
            extension: 'png',
            size: 4096,
            forceStatic: false,
        });

        const embed = new EmbedBuilder()
        .setTitle(`🖼️ Avatar de ${user.username}`)
        .setImage(avatarURL)
        .setColor(0x5865f2);

        const button = new ButtonBuilder()
        .setLabel("Ouvrir l'avatar")
        .setStyle(ButtonStyle.Link)
        .setURL(avatarURL);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });
    }
    

module.exports = { data, execute };