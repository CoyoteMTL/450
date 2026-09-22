const {
    SlashCommandBuilder,
    PermissionFlagsBits,

} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mute Textuellement un membre du serveur.")
        .addUserOption((option) =>
            option
                .setName("membre")
                .setDescription("Membre à mute")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        async execute(interaction) {
            const user = interaction.options.getUser("membre", true);
            const member = await interaction.guild.members.fetch(user.id);

            // aucun admin peut etre mute 
            if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: "❌ Impossible de mute un administrateur.",
                    ephemeral: true,
                });
            }

            //Empeche l'écriture dans tout les salon ou le bot peut modifier les permissions
            let modified = 0;

            for (const [, channel] of interaction.guild.channels.cache) {
                if (!channel.isTextBased() || channel.isThread()) {
                    continue;
                }

                try {
                    await channel.permissionOverwrites.edit(member.id, {
                        SendMessages: false,
                        SendMessagesInThreads: false,
                    });

                    modified++;
                } catch (error) {
                    console.error(`Impossible de mute ${member.user.tag} dans le salon ${channel.name}:`, error);
                        }
                    }
                

                return interaction.reply({
                    content:
                    `🔇 **${member.user.tag}** a été mute.\n` + `Il ne peut plus écrire dans **${modified} salon(s)**.`,
                });
         },
}; 

    


        
