const { Client, GatewayIntentBits, IntentsBitField, InteractionCollector, Collection, EmbedBuilder, Colors, Routes, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const dotenv = require('dotenv')
dotenv.config()

const fs = require('node:fs');
const path = require('node:path');

const { Manager } = require("erela.js");

const inquirer = require('inquirer');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const chalk = require('chalk');
const cliSpinners = require('cli-spinners');
const ora = require('ora');

var mainChannel;

/**
 * 
 * Registering commands
 * 
 */

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

let firststart = true
function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    let i = 0;

    client.guilds.cache.forEach(guild => {
        rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, guild.id), { body: commands })
        i++;
    })
    if (i == client.guilds.cache.size) {
        spinnerCmd.succeed(chalk.green('Commands registered'));
        if (firststart) {
            const spinner = ora(chalk.cyanBright('Finalizing'));
            spinner.start();
            setTimeout(() => {
                spinner.stopAndPersist({
                    symbol: chalk.greenBright('✔'),
                    text: chalk.blue.bold('Loading complete')
                });
                Prompt();
            }, 500);
            firststart = false
        }
    }
}

/**
 * 
 * Loading, unloading and reloading commands
 * 
 */

async function unloadCommand(client, commandName) {
    const spinnerUnload = ora(chalk.cyanBright(`Unloading ${commandName}`));
    spinnerUnload.color = 'green';
    spinnerUnload.spinner = cliSpinners.dots
    spinnerUnload.start();

    if (client.commands.has(commandName.substring(0, commandName.length - 3))) {
        try {
            delete require.cache[require.resolve(`./commands/${commandName}`)];
            const commandOld = require(`./commands/${commandName}`);
            commands.splice(commands.indexOf(commandOld.data.toJSON()), 1);
            client.commands.delete(commandOld.data.name);
        } catch (error) {
            setTimeout(() => {
                spinnerUnload.fail(chalk.red(`${commandName} not found`))
                Prompt();
            }, 500);
            return;
        }
    } else {
        setTimeout(() => {
            spinnerUnload.fail(chalk.red(`${commandName} not loaded`))
            Prompt();
        }, 500);
        return;
    }
    setTimeout(() => {
        spinnerUnload.succeed(chalk.green(`Unloaded ${commandName}`))
        Prompt();
    }, 500);
}

async function loadCommand(client, commandName) {
    const spinnerLoad = ora(chalk.cyanBright(`Loading ${commandName}`));
    spinnerLoad.color = 'green';
    spinnerLoad.spinner = cliSpinners.dots
    spinnerLoad.start();

    if (!client.commands.has(commandName.substring(0, commandName.length - 3))) {
        try {
            const commandNew = require(`./commands/${commandName}`);
            client.commands.set(commandNew.data.name, commandNew);
            commands.push(commandNew.data.toJSON())
        } catch (error) {
            setTimeout(() => {
                spinnerLoad.fail(chalk.red(`${commandName} not found`))
                Prompt();
            }, 500);
            return;
        }
        setTimeout(() => {
            spinnerLoad.succeed(chalk.green(`Loaded ${commandName}`))
            Prompt();
        }, 500);
    } else {
        setTimeout(() => {
            spinnerLoad.fail(chalk.red(`${commandName} already loaded reloading...`))
            reloadCommand(client, commandName);
        }, 500);
    }
}

async function reloadCommand(client, commandName) {
    const spinnerReload = ora(chalk.cyanBright(`Reloading ${commandName}`));
    spinnerReload.color = 'green';
    spinnerReload.spinner = cliSpinners.dots
    spinnerReload.start();

    delete require.cache[require.resolve(`./commands/${commandName}`)];
    const commandOld = require(`./commands/${commandName}`);
    commands.splice(commands.indexOf(commandOld.data.toJSON()), 1);
    client.commands.delete(commandOld.data.name);
    const commandNew = require(`./commands/${commandName}`);
    client.commands.set(commandNew.data.name, commandNew);
    commands.push(commandNew.data.toJSON())
    setTimeout(() => {
        spinnerReload.succeed(chalk.green(`Reloaded ${commandName}`))
        Prompt();
    }, 500);
}

/**
 * 
 * Command prompts
 * 
 */

function Prompt() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'command',
            message: chalk.blue.bold('Piech Universal') + ' >> '
        }
    ]).then(answer => {
        const args = answer.command.toLowerCase().split(' ');
        switch (args[0]) {
            case '':
                Prompt();
                break;
            case 'exit':
                let i = 0;
                client.guilds.cache.forEach(guild => {
                    let player = client.manager.players.get(guild.id);
                    player ? player.destroy(true) : null;
                    i++;
                    i == client.guilds.cache.size ? process.exit() : null;
                });
                break;
            case 'reload':
                !args[1] ? reloadCommandsPrompt(client) : reloadCommand(client, args[1]);
                break;
            case 'unload':
                !args[1] ? unloadCommandsPrompt(client) : unloadCommand(client, args[1]);
                break;
            case 'load':
                if (!args[1]) {
                    console.log(chalk.red('You need to specify a command to load'));
                    Prompt();
                } else {
                    loadCommand(client, args[1]);
                }
                break;
            case 'help':
                console.log(chalk.blue('reload') + ' - Reloads a command');
                console.log(chalk.blue('unload') + ' - Unloads a command');
                console.log(chalk.blue('load') + ' - Loads a command');
                console.log(chalk.blue('help') + ' - Shows this message');
                console.log(chalk.blue('exit') + ' - Exits the bot');
                Prompt();
                break;
            default:
                console.log(chalk.red('Invalid command'));
                Prompt();
                break;
        }
    });
}

function unloadCommandsPrompt(client) {
    inquirer.prompt([
        {
            type: 'list',
            name: 'command',
            message: 'Which command do you want to unload?',
            choices: client.commands.map(c => c.data.name + '.js')
        }
    ]).then(answer => {
        unloadCommand(client, answer.command);
    });
}

function reloadCommandsPrompt(client) {
    inquirer.prompt([
        {
            type: 'list',
            name: 'command',
            message: 'Which command do you want to reload?',
            choices: client.commands.map(c => c.data.name + '.js')
        }
    ]).then(answer => {
        reloadCommand(client, answer.command);
    });
}

/**
 * 
 * Lavalink connection
 * 
 */

const spinnerLava = ora(chalk.cyanBright('Connecting to lavalink'));
const spinnerCmd = ora(chalk.cyanBright('Loading commands'));

let prevTrack = '';
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
    .on("nodeConnect", node => spinnerLava.succeed(chalk.green(`Connected to lavalink`)))
    .on("nodeError", (node, error) => {
        if (error.message != "Unexpected op \"ready\" with data: [object Object]") {
            spinnerLava.fail(chalk.red.bold(`Lavalink node error: ${error.message}`));
            process.exit(1);
        } else {
            spinnerLava.stopAndPersist({
                symbol: chalk.yellow.bold('⚠'),
                text: chalk.yellow.bold(` Lavalink node warn: ${error.message}`)
            });
        }
    })
    .on("trackStart", (player, track) => {
        if (track.title != prevTrack) {
            client.channels.cache
            .get(player.textChannel)
            .send(`Now playing: **${track.title}**`)
            prevTrack = track.title;
        } else {
            return;
        }
    })
    .on("queueEnd", (player) => {
        client.channels.cache
            .get(player.textChannel)
            .send("Queue has ended.");

        player.destroy(true);

        global.gc();
    })
    .on("playerDisconnect", (player, from) => {
        console.log(`player ${player.guild} disconnected from ${from}`);
        player.destroy();
    });

/**
 * 
 * Once bot ready
 * 
 */

client.once('ready', () => {
    console.log(chalk.cyan(`Starting Piech Universal...`));
    spinnerLava.color = 'yellow';
    spinnerLava.spinner = cliSpinners.bouncingBar;
    spinnerLava.start();
    setTimeout(() => {
        client.manager.init(client.user.id);

        spinnerCmd.text = chalk.cyanBright('Loading commands');
        spinnerCmd.color = 'green';
        spinnerCmd.spinner = cliSpinners.dots;
        spinnerCmd.start();
        setTimeout(() => {
            registerCommands();
        }, 1500);
    }, 2000);


    mainChannel = client.guilds.cache.get(process.env.MAINGUILDID).channels.cache.get(process.env.MAINCHANNELID);

    client.user.setPresence({
        activities: [{ name: '/help', type: ActivityType.Listening }],
        status: 'online',
    })
});

/**
 * 
 * Guild create/delete events
 * 
 */

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
    console.error(chalk.red.bold(chalk.blue.bold('Piech Universal') + ' >> ' + 'Unhandled promise rejection:'), err);
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
        console.log(chalk.blue.bold('\nPiech Universal') + ' >> ' + chalk.cyan.bold(`${interaction.user.tag}`) + chalk.gray(` used `) + chalk.cyan.bold(`${interaction}`) + chalk.gray(` on `) + chalk.cyan.bold(`${interaction.guild.name}`));
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error)
        await interaction.reply({ content: 'There was an error with executing this command!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);