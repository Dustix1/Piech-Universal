const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-activity')
        .setDescription('[Redacted]')
        .addStringOption(option => 
            option
            .setName('name')
            .setDescription('Text')
            .setRequired(true))
        .addStringOption(option =>
            option
            .setName('type')
            .setDescription('Activity type')
            .setRequired(true)
            .addChoices(
                { name: 'Listening', value: 'Listening' },
                { name: 'Playing', value: 'Playing' },
                { name: 'Watching', value: 'Watching' },
                { name: 'Competing', value: 'Competing' },
            )),
    async execute(interaction, client) {
        console.log(`**${interaction.user.tag}** used command **${interaction.commandName}** on guild **${interaction.guild.name}**`);
        
        if (interaction.user.id !== '385845659674345484') return interaction.reply({ content: 'You don\'t have acces to this command.', ephemeral: true });
        let type
        switch (interaction.options.getString('type')) {
            case 'Listening':
                type = ActivityType.Listening
                break
            case 'Playing':
                type = ActivityType.Playing
                break
            case 'Watching':
                type = ActivityType.Watching
                break
            case 'Competing':
                type = ActivityType.Competing
                break
            default:
                type = ActivityType.Listening
                break
        }
        client.user.setPresence({
            activities: [{ name: interaction.options.getString('name'), type: type }],
            status: 'online',
        })
        interaction.reply({ content: 'Activity set', ephemeral: true})
    }
}