const { SlashCommandBuilder, Collection } = require('discord.js');
const voice = require('elevenlabs-node');
const gtts = require('node-gtts')('es');
var path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { generateDependencyReport, AudioPlayerStatus, NoSubscriberBehavior, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('say something')
    .addStringOption(option => option.setName('text').setDescription('what ever you want...')),
  //.setGuildOnly(true)
  //.setArgs(1)
  //.setArgsType(['string']),
  async execute(interaction, client) {

    const fileName = 'audio.mp3';
    const text = interaction.options.getString('text');
    const channel = interaction.member.voice.channel;
    const voiceChannel = client.channels.cache.get(channel.id);
    //Error case handling
    if (!channel) return interaction.channel.send('Please join a Voice Channel first!');

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Idle,
      },
    });

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,//interaction.guild.voiceAdapterCreator,
    });

    var filepath = path.join(__dirname, `../speech/${channel.id}.mp3`);


    // player.on(AudioPlayerStatus.Playing, () => {
    //   console.log('The audio player has started!');
    // });

    // player.on('error', error => {
    //   console.error(`Error: ${error.message} with resource`);
    // });


    // voice.getVoices(process.env.ELEVEN_KEY).then(res => {

    //   console.log(res);
    // });
    if (text) {

      voice.textToSpeech(process.env.ELEVEN_KEY, process.env.VOICEID, filepath, text, 0.75, 0.75).then(res => {
        console.log(res);
        
        if (res.status === 'ok') {
          console.log('creating audio', `${channel.id}.mp3`);
          const resource = createAudioResource(`C:/Users/user/source/repos/LunaB/src/speech/${channel.id}.mp3`);
          player.play(resource);
          connection.subscribe(player);
        }
      });
    } else {

      interaction.reply('-_-');
    }
    player.on('stateChange', (oldState, newState) => {
      console.error(`'${oldState.status}' => '${newState.status}'`);
    });

    player.on('error', error => {
      console.error(error);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.error('idle');
    });

    player.on(AudioPlayerStatus.Playing, () => {
      console.error('playing');
    });

    player.on(AudioPlayerStatus.Buffering, () => {
      console.error('Buffering');
    });

    player.on(AudioPlayerStatus.AutoPaused, () => {
      console.error('AutoPaused');
    });

    player.on(AudioPlayerStatus.Paused, () => {
      console.error('Paused');
    });

    if (text) {
      interaction.reply(text);
    }
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