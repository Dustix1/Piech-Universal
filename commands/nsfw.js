const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Booru = require('booru')

/*let choices = '';
for (const site in JSON.parse(JSON.stringify(Booru.sites))) {
    choices += `{ name: '${site}', value: '${site}' },\n`
}
console.log(choices)*/

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nsfw')
        .setDescription('Searches for an image on a sussy website.')
        .addStringOption(option =>
            option
                .setName('site')
                .setDescription('The web to search on')
                .addChoices(
                    { name: 'e621.net', value: 'e621.net' },
                    { name: 'e926.net', value: 'e926.net' },
                    { name: 'hypnohub.net', value: 'hypnohub.net' },
                    { name: 'danbooru.donmai.us', value: 'danbooru.donmai.us' },
                    { name: 'konachan.com', value: 'konachan.com' },
                    { name: 'konachan.net', value: 'konachan.net' },
                    { name: 'yande.re', value: 'yande.re' },
                    { name: 'gelbooru.com', value: 'gelbooru.com' },
                    { name: 'rule34.xxx', value: 'rule34.xxx' },
                    { name: 'safebooru.org', value: 'safebooru.org' },
                    { name: 'tbib.org', value: 'tbib.org' },
                    { name: 'xbooru.com', value: 'xbooru.com' },
                    { name: 'rule34.paheal.net', value: 'rule34.paheal.net' },
                    { name: 'derpibooru.org', value: 'derpibooru.org' },
                    { name: 'realbooru.com', value: 'realbooru.com' },
                )
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('search')
                .setDescription('Split each tag (that you search) with spaces.')
                .setRequired(true)),
    async execute(interaction, client) {
        if (!interaction.channel.nsfw) return interaction.reply({ content: 'This channel is not NSFW!', ephemeral: true });

        const tags = interaction.options.getString('search').split(' ');

        Booru.search(interaction.options.getString('site'), eval(tags), { limit: 50 })
            .then(posts => {
                if (posts.length == 0) return interaction.reply({ content: 'Nothing found.', ephemeral: true })

                const link = posts[Math.round(Math.random() * posts.length)].fileUrl;

                interaction.reply({ content: link })

                /*const embed = new EmbedBuilder()
                    .setImage(link)
                    .setColor('Random')
                console.log(link);
                interaction.reply({ embeds: [embed] })*/
            })
    }
}