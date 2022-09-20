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
const play = require('play-dl');
const ytdl = require("ytdl-core");
const ytSearch = require('yt-search');

const queue = new Map();

const playCM = require('./play')

var connection = joinVoiceChannel

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or a playlist')
        .addStringOption(option =>
            option
                .setName('search')
                .setDescription('The song to search')
                .setRequired(true))
        .addBooleanOption(option =>
            option
                .setName('playlist')
                .setDescription('Is the link a playlist?')),
    async execute(interaction, client) {
        console.log(`**${interaction.user.tag}** used command **${interaction.commandName}** on guild **${interaction.guild.name}**`);

        const voice_channel = interaction.member.voice.channel;
        const serverQueue = queue.get(interaction.guild.id);

        if (!voice_channel) return interaction.reply('You must be in a voice channel to execute this command!');

        let song = {}

        if (!interaction.options.getBoolean('playlist')) {
            if (ytdl.validateURL(interaction.options.getString('search'))) {
                const songInfo = await ytdl.getInfo(interaction.options.getString('search'));
                song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url };
            } else {
                const videoFinder = async (query) => {
                    const videoResult = await ytSearch(query);
                    return (videoResult.videos.length > 1) ? videoResult.videos[0] : null
                }
                const video = await videoFinder(interaction.options.getString('search'))
                if (video) {
                    song = { title: video.title, url: video.url }

                } else {
                    return interaction.reply({ content: 'Video not found', ephemeral: true });
                }
            }

            if (!serverQueue) {
                await interaction.reply({ content: `Video found successfully!`, ephemeral: true });

                const queueConstructor = {
                    voice_channel: voice_channel,
                    text_channel: interaction.channel,
                    connection: null,
                    loop: false,
                    songs: []
                }

                queue.set(interaction.guild.id, queueConstructor);
                queueConstructor.songs.push(song);

                try {
                    const connection = await joinVoiceChannel({
                        channelId: voice_channel.id,
                        guildId: voice_channel.guild.id,
                        adapterCreator: voice_channel.guild.voiceAdapterCreator,
                    })
                    queueConstructor.connection = connection
                    videoPlayer(interaction, interaction.guild, queueConstructor.songs[0])
                } catch (error) {
                    queue.delete(interaction.guild.id)
                    interaction.reply('There was an error while connecting.')
                }
            } else {
                serverQueue.songs.push(song)
                return interaction.reply(`👌 **${song.title}** added to queue!`)
            }

        } else {
            const videoFinder = async (query) => {
                const videoResult = await ytSearch(query);
                return (videoResult.videos.length > 1) ? videoResult.videos[0] : null
            }
            const video = await videoFinder(interaction.options.getString('search'))
            if (video) return interaction.reply({ content: 'This is not a playlist', ephemeral: true });
            if (!play.validate(interaction.options.getString('search'))) return interaction.reply({ content: 'This is not a playlist', ephemeral: true });

            try {
                const playlist = await play.playlist_info(interaction.options.getString('search'), { incomplete: true });
                const videos = await playlist.all_videos();

                await interaction.reply({ content: `Playlist found successfully!`, ephemeral: true });

                if (!serverQueue) {

                    const queueConstructor = {
                        voice_channel: voice_channel,
                        text_channel: interaction.channel,
                        connection: null,
                        loop: false,
                        songs: []
                    }

                    queue.set(interaction.guild.id, queueConstructor);
                    song = { title: videos[0].title, url: videos[0].url };
                    queueConstructor.songs.push(song);

                    try {
                        const connection = await joinVoiceChannel({
                            channelId: voice_channel.id,
                            guildId: voice_channel.guild.id,
                            adapterCreator: voice_channel.guild.voiceAdapterCreator,
                        })
                        queueConstructor.connection = connection
                        videoPlayer(interaction, interaction.guild, queueConstructor.songs[0])
                    } catch (error) {
                        queue.delete(interaction.guild.id)
                        interaction.reply('There was an error while connecting.')
                    }

                }

                const songQueue = queue.get(interaction.guild.id);
                videos.forEach(video => {
                    song = { title: video.title, url: video.url };
                    if (video != videos[0]) songQueue.songs.push(song);
                });
            } catch (err) {
                return interaction.reply({ content: 'This playlist does not exist.', ephemeral: true })
            }

        }
    },

    /**
     * 
     *      Disconnect function
     * 
     */

    disconnect(guild, interaction) {
        const serverQueue = queue.get(guild.id);
        if (interaction) {
            try {
                queue.delete(guild.id);
                serverQueue.connection.destroy();
                interaction.reply('Disconnected!');
            } catch (error) {
                interaction.reply({ content: 'I am not connected to a voice channel', ephemeral: true });
            }
        } else {
            try {
                queue.delete(guild.id);
                serverQueue.connection.destroy();
                console.log(`Disconnected! >> ${guild.name}`);
            } catch (error) {
                console.log(`I am not connected to a voice channel >> ${guild.name}`);
            }
        }
    },

    /**
     * 
     *      Get queued songs
     * 
     */

    getQueuedSongs(interaction, startIndex) {

        const serverQueue = queue.get(interaction.guild.id)

        if (!serverQueue) {
            interaction.reply('There is nothing queued on this server!');
            return 'No';
        }

        let songs = serverQueue.songs
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
    },

    /**
     * 
     *      Skip
     * 
     */

    skip_song(interaction) {
        const serverQueue = queue.get(interaction.guild.id);

        if (!interaction.member.voice.channel) return interaction.reply({ content: 'You must be in a voice channel to execute this command!', ephemeral: true });
        if (!serverQueue) return interaction.reply({ content: 'I am not connected to a voice channel', ephemeral: true });
        const songQueue = queue.get(interaction.guild.id)
        songQueue.songs.shift()
        interaction.reply({ content: 'Skipping song...' });
        videoPlayer(interaction, interaction.guild, songQueue.songs[0])
    },

    /**
     * 
     *      Loop
     * 
     */

    loopFunction(interaction) {
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'You must be in a voice channel to execute this command!', ephemeral: true });
        const songQueue = queue.get(interaction.guild.id);
        try {
            if (songQueue.loop == false) {
                songQueue.loop = true
                interaction.reply('👍 Loop started');
            } else {
                songQueue.loop = false
                interaction.reply('👍 loop stopped');
            }
        } catch (error) {
            interaction.reply({ content: 'I am not connected to a voice channel', ephemeral: true });
        }

    }
}

/**
 * 
 *      Video player (downloading the video)
 * 
 */

const videoPlayer = async (interaction, guild, song) => {
    const songQueue = queue.get(guild.id)

    if (!song) {
        module.exports.disconnect(guild);
        global.gc();
        return
    }

    let stream = await play.stream(song.url)

    let resource = createAudioResource(stream.stream, {
        inputType: stream.type
    })

    let player = createAudioPlayer({
        behaviors: {
            //noSubscriber: NoSubscriberBehavior.Play
        }
    })

    player.play(resource)

    songQueue.connection.subscribe(player)
    player.on(AudioPlayerStatus.Idle, () => {
        if (songQueue.loop == false) {
            songQueue.songs.shift()
        }
        videoPlayer(interaction, guild, songQueue.songs[0])
    })
    await songQueue.text_channel.send(`🎶Now playing **${song.title}**`)

}

/**
 * 
 *      Send queued songs
 * 
 */

const sendQueuedSongs = (interaction, queuedSongs) => {
    const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('Queued songs')
        .setAuthor({ name: 'Queue', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' })
        .addFields({ name: '**Now Playing**\n', value: queuedSongs })
        .setFooter({ text: '© Dustix#7302', iconURL: 'https://i.imgur.com/M6GOXYo.png%27' });

    interaction.channel.send({ embeds: [embed] })
}