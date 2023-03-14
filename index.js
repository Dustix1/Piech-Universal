const { Client, GatewayIntentBits, IntentsBitField, InteractionCollector, Collection, EmbedBuilder, Colors, Routes, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const dotenv = require('dotenv')
dotenv.config()

const fs = require('node:fs');
const path = require('node:path');

const playCM = require('./commands/play')

const { Manager } = require("erela.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

var mainChannel;
var mainGuild;

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

function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    client.guilds.cache.forEach(guild => {
        rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, guild.id), { body: commands })
            .then((data) => console.log(`Successfully registered ${data.length} commands on guild ${guild.name}.`))
            .catch(`Could not register commands on guild ${guild.name}!`);
    });
}

client.manager = new Manager({
    nodes: [
      {
        host: "localhost",
        port: 2333,
        password: process.env.LAVALINK_PASS,
      },
    ],
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  })
  .on("nodeConnect", node => console.log(`Node ${node.options.identifier} connected`))
  .on("nodeError", (node, error) => console.log(`Node ${node.options.identifier} had an error: ${error.message}`))
  .on("trackStart", (player, track) => {
    client.channels.cache
      .get(player.textChannel)
      .send(`Now playing: **${track.title}**`);
  })
  .on("queueEnd", (player) => {
    client.channels.cache
      .get(player.textChannel)
      .send("Queue has ended.");

    player.destroy(true);

    global.gc();
  });

client.once('ready', () => {
    registerCommands();
    console.log('Ready');
    client.manager.init(client.user.id);

    mainChannel = client.guilds.cache.get(process.env.MAINGUILDID).channels.cache.get(process.env.MAINCHANNELID);
    mainGuild = client.guilds.cache.get(process.env.MAINGUILDID);

    mainChannel.send({ content: `Bot Ready` })
    client.user.setPresence({
        activities: [{ name: '/help', type: ActivityType.Listening }],
        status: 'online',
    })
});

client.on('guildCreate', (guild) => {
    registerCommands();
    mainChannel.send({ content: `Added to guild name: ${guild.name} id: ${guild.id}  ->>  Reloading commands...` })
});

client.on('guildDelete', (guild) => {
    mainChannel.send({ content: `Removed from guild name: ${guild.name} id: ${guild.id}` })
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

/**
 * 
 *      ERROR handler
 * 
 */

process.on('unhandledRejection', err => {
    const guild = client.guilds.cache.get(process.env.DSGUILDID);
    console.error('Unhandled promise rejection:', err);
    const error = new EmbedBuilder()
        .setTitle(`Error detected`)
        .setDescription("```" + err + "```")
        .setColor(Colors.Red)
    mainChannel.send({ embeds: [error] })
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
        console.log(`**${interaction.user.tag}** used command **${interaction.commandName}** on guild **${interaction.guild.name}**`);
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error)
        await interaction.reply({ content: 'There was an error with executing this command!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);