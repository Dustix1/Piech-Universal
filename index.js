const { Client, GatewayIntentBits, IntentsBitField, InteractionCollector, Collection, EmbedBuilder, Colors, Routes, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const dotenv = require('dotenv')
dotenv.config()

const fs = require('node:fs');
const path = require('node:path');

const playCM = require('./commands/play')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
    console.log(`Adding command ${command.data.name}`)
}

client.once('ready', () => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    client.guilds.cache.forEach(guild => {
        console.log(`${guild.name}\n`)
    });

    client.guilds.cache.forEach(guild => {
        rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, guild.id), { body: commands })
            .then((data) => console.log(`Successfully registered ${data.length} commands on guild ${guild.name}.`))
            .catch(`Could not register commands on guild ${guild.name}!`);
    });

    console.log('Ready');
    client.user.setPresence({
        activities: [{ name: '/help', type: ActivityType.Listening }],
        status: 'online',
    })
});

/**
 * 
 *      Disconnect handler
 * 
 */

client.on('voiceStateUpdate', (oldState, args, newState) => {
    if (oldState.channelId === null || typeof oldState.channelId == 'undefined') return;

        if (oldState.member.displayName === 'Piech Universal') {
            playCM.disconnect(oldState.guild);
        }
});

/**
 * 
 *      ERROR handler
 * 
 */

process.on('unhandledRejection', err => {
    const guild = client.guilds.cache.get('1019590945634795521'); // 1019590945634795521 872422184658800680
    const ereport = guild.channels.cache.get('1019611483837042699'); // 1019611483837042699 1020787576778530887
    console.error('Unhandled promise rejection:', err);
    const error = new EmbedBuilder()
        .setTitle( `Error detected`)
        .setDescription("```" + err + "```")
        .setColor(Colors.Red)
    ereport.send({ embeds: [error] })
});

/**
 * 
 *      Command handler
 * 
 */

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error)
        await interaction.reply({ content: 'There was an error with executing this command!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);