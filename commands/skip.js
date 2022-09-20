const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const playCM = require('./play')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.'),
    async execute(interaction, client) {
        console.log(`**${interaction.user.tag}** used command **${interaction.commandName}** on guild **${interaction.guild.name}**`);
        
        playCM.skip_song(interaction);
    }
}