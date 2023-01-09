const { SlashCommandBuilder, Collection } = require('discord.js');
const gtts = require('node-gtts')('es');
var path = require('path');
const { generateDependencyReport, AudioPlayerStatus, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('say something')
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

    var filepath = path.join(__dirname, `../speech/${channel.id}.mp3`);

    gtts.save(filepath, text, function () {
      console.log('save done');
    })

    // gtts.getAudio(text, function (error, binaryStream) {
    //   if (error) {
    //     console.error(error);
    //     return;
    //   }

    //   //const resource = createAudioResource(`C:/Users/Darkf/source/repos/LunaB/src/speech/${text}.mp3`);
    //   player.play(binaryStream);

    // });




    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,//interaction.guild.voiceAdapterCreator,
    });


    setTimeout(() => { 
      console.log('habla');
      const resource = createAudioResource(`C:/Users/Darkf/source/repos/LunaB/src/speech/${channel.id}.mp3`);
      player.play(resource);
      connection.subscribe(player)

    }, 3_000);

    // player.play(resource);
    // connection.subscribe(player);

    interaction.reply(text);

    // Subscribe the connection to the audio player (will play audio on the voice connection)



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