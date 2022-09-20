const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Sends a command list'),
    async execute(interaction, client) {
        console.log(`**${interaction.user.tag}** used command **${interaction.commandName}** on guild **${interaction.guild.name}**`);
        
        var allcommands = '';
        client.commands.forEach(command => {
            if (command.data.description != '[Redacted]') {
                allcommands += `**/${command.data.name}** -> *${command.data.description}*\n`
            } else if (interaction.user.id === '385845659674345484'){
                allcommands += `**/${command.data.name}** -> *${command.data.description}*\n`
            }
        });

        const helpEmbed = new EmbedBuilder()
            .setColor(0x62B0FE)
            .setTitle('Help')
            .addFields(
                //{ name: '-------', value: '**Update**:\n🔘 Slash commands\n' },
                { name: 'Commands', value: allcommands },
            )
            .setURL('https://www.f13cybertech.cz/%27')
            .setAuthor({ name: 'Info', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' })
            .setThumbnail('https://i.ibb.co/vZ2VrMv/Piech-commands.jpg')
            .setFooter({ text: '© Dustix#7302', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' });

        interaction.reply({ embeds: [helpEmbed] })
    }
}