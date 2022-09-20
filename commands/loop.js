const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const playCM = require('./play')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Loops the current song.'),
    async execute(interaction, client) {
        
        playCM.loopFunction(interaction);
    }
}