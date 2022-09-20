const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const playCM = require('./play')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Lists the current queue.'),
    async execute(interaction, client) {
        
        if (playCM.getQueuedSongs(interaction, 0) != 'No') {
            interaction.reply({ content: 'Listing Queue.', ephemeral: true })
        }
    }
}