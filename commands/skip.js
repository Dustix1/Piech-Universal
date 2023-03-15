const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const playCM = require('./play')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.'),
    async execute(interaction, client) {
        
        playCM.skip_song(interaction, client);
    }
}