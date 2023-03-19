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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play-radio')
        .setDescription('Plays a live radio')
        .addStringOption(option =>
            option
                .setName('radio')
                .setDescription('The radio to play')
                .addChoices(
                    { name: 'Rádio Kiss', value: 'https://n06a-eu.rcs.revma.com/asn0cmvb938uv?rj-ttl=5&rj-tok=AAABhvkLhuAAn-b10VMKUMcR-g' },
                    { name: 'Rádio Beat', value: 'https://n26a-eu.rcs.revma.com/3d47nqvb938uv?rj-ttl=5&rj-tok=AAABhvkbWKoA0AdijpMm-RGfeg'},
                    { name: 'Rádio Čas', value: 'http://icecast6.play.cz/casradio128.mp3'},
                    { name: 'Simulator Radio', value: 'https://simulatorradio.stream/stream?t=16792459761679246000350'}
                )
                .setRequired(true)),
    async execute(interaction, client) {
        if(!interaction.member.voice.channel.id) {
            interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
            return;
        }

        const res = await client.manager.search(
            interaction.options.getString('radio'),
            interaction.client
        );

        switch (interaction.options.getString('radio')) {
            case 'https://n06a-eu.rcs.revma.com/asn0cmvb938uv?rj-ttl=5&rj-tok=AAABhvkLhuAAn-b10VMKUMcR-g':
                res.tracks[0].title = 'Rádio Kiss';
                break;
            case 'https://n26a-eu.rcs.revma.com/3d47nqvb938uv?rj-ttl=5&rj-tok=AAABhvkbWKoA0AdijpMm-RGfeg':
                res.tracks[0].title = 'Rádio Beat';
                break;
            case 'http://icecast6.play.cz/casradio128.mp3':
                res.tracks[0].title = 'Rádio Čas';
                break;
            case 'https://simulatorradio.stream/stream?t=16792459761679246000350':
                res.tracks[0].title = 'Simulator Radio';
                break;
        }
        

        // Create a new player. This will return the player if it already exists.
        const player = client.manager.create({
            guild: interaction.guild.id,
            voiceChannel: interaction.member.voice.channel.id,
            textChannel: interaction.channel.id,
        });

        try {
            // Adds the first track to the queue.
        player.queue.add(res.tracks[0]);
        interaction.reply(`Enqueuing track **${res.tracks[0].title}**.`);
        } catch (error) {
            interaction.reply({ content: 'Radio not found!', ephemeral: true });
            player.destroy(true);
            return;
        }
        
        player.connect();

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
    }
}