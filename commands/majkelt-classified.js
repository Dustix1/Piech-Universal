const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const gis = require('g-i-s');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('majkelt-classified')
        .setDescription('[Redacted]'),
    async execute(interaction, client) {
        
        if (interaction.user.id !== '714896664879431760' && interaction.user.id !== '385845659674345484') return interaction.reply({ content: 'You don\'t have acces to this command.', ephemeral: true });
        if (!interaction.channel.nsfw) return interaction.reply({ content: 'This channel is not NSFW!', ephemeral: true});

        gis('sexy woman', results);

        function results(err, results) {
            if (err) {
                console.error(err);
            } else {
                let res = JSON.parse(JSON.stringify(results[Math.round(Math.random() * results.length)]));

                interaction.reply({ content: res.url })

                /*const embed = new EmbedBuilder()
                    .setImage(res.url)
                    .setColor('Random')
                interaction.reply({ embeds: [embed] })*/
            }
        }
    }
}