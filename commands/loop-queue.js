const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const playCM = require('./play')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop-queue')
        .setDescription('Loops the whole queue.'),
    async execute(interaction, client) {
        
        playCM.loopQueue(interaction);
    }
}