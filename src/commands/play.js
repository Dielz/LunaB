const { SlashCommandBuilder, Collection } = require('discord.js');
const ytdl = require('ytdl-core');
const { generateDependencyReport, AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('play youtube video')
        .addStringOption(option => option.setName('text').setDescription('what ever you want...')),
    //.setGuildOnly(true)
    //.setArgs(1)
    //.setArgsType(['string']),
    async execute(interaction, client) {

        const text = interaction.options.getString('text');
        const channel = interaction.member.voice.channel;
        const voiceChannel = client.channels.cache.get(channel.id);
        //Error case handling
        if (!channel) return interaction.channel.send('Please join a Voice Channel first!');

        const player = createAudioPlayer();

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('The audio player has started playing!');
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource`);
        });


        const connection = joinVoiceChannel({
            selfDeaf: false,
            selfMute: false,
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,//interaction.guild.voiceAdapterCreator,
        });


        if (ytdl.validateURL(text)) {

            const stream = ytdl(text, { filter: 'audioonly' });

            const resource = createAudioResource(stream)

            player.play(resource);

            connection.subscribe(player)


            interaction.reply('Ahí va tu musiquita de mierda!');

        } else {

            interaction.reply('Eso no es un link de youtube pendejo...');

        }


    },
};