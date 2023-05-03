const { SlashCommandBuilder } = require('discord.js');
const { generateDependencyReport, AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Hace que el bot se una a un canal de voz'),
  //.setGuildOnly(true)
  //.setArgs(1)
  //.setArgsType(['string']),
  async execute(interaction, client) {

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

   // const resource = createAudioResource('C:/Users/Darkf/source/repos/LunaB/src/speech/hola.mp3');
   // player.play(resource);

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,//interaction.guild.voiceAdapterCreator,
    });


    // player.play(resource);
    // connection.subscribe(player);

    interaction.reply('Hello!');

    // Subscribe the connection to the audio player (will play audio on the voice connection)
    //connection.subscribe(player);

    // subscription could be undefined if the connection is destroyed!
    // if (subscription) {
    //   // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
    //   //setTimeout(() => subscription.unsubscribe(), 3_000_000);
    //  // setTimeout(() =>  interaction.reply('Estoy aburrida!'), 300_000);  
    // }

    // checking for ending, leaving VC if true
    /*player.on(voiceDiscord.AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });*/



  },
};