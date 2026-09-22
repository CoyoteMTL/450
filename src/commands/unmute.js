const {
    SlashCommandBuilder,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Unmute Textuellement un membre")
        .addUserOption((option) =>
            option
                .setName("membre")
                .setDescription("Membre à unmute")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        async execute(interaction) {
            const user = interaction.options.getUser('membre', true);
            const member = await interaction.guild.members.fetch(user.id);

            let modified = 0;

            for (const [, channel] of interaction.guild.channels.cache) {
                if (!channel.isTextBased() || channel.isThread()) {
                    continue;
                }

            try {
                await channel.permissionOverwrites.edit(member.id, {
                    SendMessages: null,
                    SendMessagesInThreads: null,
                });

                modified++;
            } catch (error) {
                console.error(`Impossible de unmute ${member.user.tag} dans le salon ${channel.name}:`, error);
            }
        }

        return interaction.reply({
            content: `🔊 **${member.user.tag}** n'est plus mute.\n` + `Les permissions normales ont été restaurées dans **${modified} salon(s)**.`,
        });
    },
};