const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('business-card')
        .setDescription('Sends Piechs business card'),
    async execute(interaction, client) {
        
        const vizitkaEmbed = new EmbedBuilder()
            .setColor(0xfc4f38)
            .addFields({ name: 'Martin Piech', value: 'Chief Executive Officer' })
            .setTitle('Cyberpiech')
            .setURL('https://www.f13cybertech.cz/%27')
            .setAuthor({ name: 'Info', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' })
            .setThumbnail('https://i.imgur.com/r0CVj08.jpg%27')
            .addFields(
                { name: 'E-mail', value: 'martin@f13cybertech.cz', inline: true },
                { name: 'Phone number', value: '+420 721 232 021', inline: true },
            )
            .setFooter({ text: 'Cyberpiech s.r.o', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' });

        interaction.reply({ embeds: [vizitkaEmbed] })
    }
}