const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const playCM = require('./play')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnects the bot from the voice channel.'),
    async execute(interaction, client) {
        console.log(`**${interaction.user.tag}** used command **${interaction.commandName}** on guild **${interaction.guild.name}**`);
        
        playCM.disconnect(interaction.guild, interaction);
    }
}