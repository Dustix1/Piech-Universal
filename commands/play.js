const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    NoSubscriberBehavior,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    AudioPlayer,
    entersState,
    getVoiceConnection
} = require('@discordjs/voice');

const queue = new Map();

let player;

var connection = joinVoiceChannel

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or a playlist')
        .addStringOption(option =>
            option
                .setName('search')
                .setDescription('The song to search')
                .setRequired(true)),
    async execute(interaction, client) {

        const res = await client.manager.search(
            interaction.options.getString('search'),
            interaction.client
        );

        // Create a new player. This will return the player if it already exists.
        player = client.manager.create({
            guild: interaction.guild.id,
            voiceChannel: interaction.member.voice.channel.id,
            textChannel: interaction.channel.id,
        });

        // Connect to the voice channel.
        player.connect();

        // Adds the first track to the queue.
        player.queue.add(res.tracks[0]);
        interaction.reply(`Enqueuing track **${res.tracks[0].title}**.`);

        // Plays the player (plays the first track in the queue).
        // The if statement is needed else it will play the current track again
        if (!player.playing && !player.paused && !player.queue.size)
            player.play();

        // For playlists you'll have to use slightly different if statement
        if (
            !player.playing &&
            !player.paused &&
            player.queue.totalSize === res.tracks.length
        )
            player.play();
    },
    /**
     * 
     *      Disconnect function
     * 
     */

    disconnect(guild, interaction) {
        if (player.state != "DISCONNECTED") {
            player.destroy(true);
            interaction.reply({ content: 'Disconnected from voice channel!' });
        } else {
            interaction.reply({ content: 'I am not connected to any voice channel!', ephemeral: true });
        }

    },

    /**
     * 
     *      Get queued songs
     * 
     */

    getQueuedSongs(interaction, startIndex) {
        if (!player || player.state == "DISCONNECTED") {
            interaction.reply({ content: 'I am not connected to any voice channel!', ephemeral: true });
            return 'No';
        } else {
            if (player.queue.size <= 0) {
                interaction.reply({ content: 'There is nothing queued on this server!', ephemeral: true });
                return 'No';
            } else {

                let songs = player.queue
                let queuedSongs = ''
                let moreThanTen = false;

                for (let i = startIndex; i < songs.length; i++) {
                    let index = i
                    let title = songs[i].title

                    if (i > startIndex + 9) {
                        moreThanTen = true
                        break
                    }
                    queuedSongs += ('**' + (index + 1) + '.** ***' + title + '***\n')
                }
                if (moreThanTen) {
                    sendQueuedSongs(interaction, queuedSongs)
                    module.exports.getQueuedSongs(interaction, startIndex + 10)
                } else {
                    sendQueuedSongs(interaction, queuedSongs)
                }
            }
        }
    },

    /**
     * 
     *      Skip
     * 
     */

    skip_song(interaction) {
        if (!player || player.state == "DISCONNECTED") {
            interaction.reply({ content: 'I am not connected to any voice channel!', ephemeral: true });
        } else {
            player.stop();
            interaction.reply({ content: 'Skipping song...' });
        }
    },

    /**
     * 
     *      Loop
     * 
     */

    loopSong(interaction) {
        if (!player || player.state == "DISCONNECTED") {
            interaction.reply({ content: 'I am not connected to any voice channel!', ephemeral: true });
        } else {
            player.trackRepeat ? player.setTrackRepeat(false) : player.setTrackRepeat(true);
            interaction.reply({ content: `Song loop is now ${player.trackRepeat ? "**enabled**" : "**disabled**"} :repeat:` });
        }
    },

    loopQueue(interaction) {
        if (!player || player.state == "DISCONNECTED") {
            interaction.reply({ content: 'I am not connected to any voice channel!', ephemeral: true });
        } else {
            player.trackRepeat ? player.setQueueRepeat(false) : player.setQueueRepeat(true);
            interaction.reply({ content: `Queue loop is now ${player.trackRepeat ? "**enabled**" : "**disabled**"} :repeat:` });
        }
    }
}

const sendQueuedSongs = (interaction, queuedSongs) => {
    const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('Queued songs')
        .setAuthor({ name: 'Queue [' + player.queue.size + ']', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' })
        .addFields({ name: '**Queued songs:**\n', value: queuedSongs })
        .setFooter({ text: '© Dustix#7302', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' });

    interaction.channel.send({ embeds: [embed] })
}