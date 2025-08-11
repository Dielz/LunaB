const { SlashCommandBuilder } = require('discord.js');
const eleven = require('elevenlabs-node');

const googleTTS = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
//const authenticateImplicitWithAdc = require('../authenticateImplicitWithAdc')
var path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { AudioPlayerStatus, NoSubscriberBehavior, joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('say something')
    .addStringOption(option =>
      option.setName('voice')
        .setDescription('Wich voice should i use?')
        .setRequired(true)
        .addChoices(
          { name: 'Dennise', value: '2AGSW9bXBXFtuYaou83B' },
          { name: 'Jose luis', value: 'UcTdOmXMAhfQG7IF2mZe' },
          { name: 'Otro', value: 'ARjf2RfiU8YrKwhOTfbA' },
        ))
    .addStringOption(option => option.setName('text').setDescription('what ever you want...')),
  //.setGuildOnly(true)
  //.setArgs(1)
  //.setArgsType(['string']),
  async execute(interaction, client) {

    const text = interaction.options.getString('text');
    const voice = interaction.options.getString('voice');
    const gtts = new googleTTS.TextToSpeechClient();

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Idle,
      },
    });

    if (text) {

      // await client.commands.get('join').execute(interaction, client);
      //  console.log(connection);

      //  const connection = getVoiceConnection(interaction.guild.id);
      // console.log(connection);
      const channel = interaction.member.voice.channel;
      const voiceChannel = client.channels.cache.get(channel.id);
      if (!channel) return interaction.channel.send('Please join a Voice Channel first!');

      const connection = joinVoiceChannel({
        // debug: true,
        selfDeaf: false,
        selfMute: false,
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,//interaction.guild.voiceAdapterCreator,
      });
      var filepath = path.join(__dirname, `../speech/${channel.id}.mp3`);
      var filepath2 = path.join(__dirname, `../speech/tetal.mp3`);

      const request = {
        audioConfig: {
          audioEncoding: "LINEAR16",
          effectsProfileId: [ "headphone-class-device"],
          pitch: 0,
          speakingRate: 1
        },
        input: { text: text },
        voice: {
          languageCode: "es-US",
          name: "es-US-Studio-B"
        },
       // audioConfig: { audioEncoding: 'MP3' },
      };

      // const request = {
      //   input: { text: text },
      //   voice: {
      //     languageCode: "es-US",
      //     name: "es-US-Wavenet-D" // Usa una voz estándar
      //   },
      //   audioConfig: {
      //     audioEncoding: "MP3", // Cambia a MP3 si quieres archivo mp3
      //     effectsProfileId: ["headphone-class-device"],
      //     pitch: 0,
      //     speakingRate: 1
      //   }
      // };

      // Performs the text-to-speech request
      const [response] = await gtts.synthesizeSpeech(request)

      // // Write the binary audio content to a local file
      const writeFile = util.promisify(fs.writeFile);
      await writeFile(filepath, response.audioContent, 'binary');

      console.log('Audio content written to file: output.mp3');
      //  console.log(filepath);
      const resource = createAudioResource(filepath);
      player.play(resource);
      Subscribe = connection.subscribe(player);
      // interaction.reply({ content: 'Talking', ephemeral: true });

      /////////////////////////////////////////////////// eleven TTS

      // eleven.textToSpeechStream(process.env.ELEVEN_KEY, '21m00Tcm4TlvDq8ikWAM', `${text}.`, 0.60, 0.55).then(res => {

      //   if (res) {
      //    // console.info(res)
      //     const resource = createAudioResource(res);
      //     player.play(resource);
      //     Subscribe = connection.subscribe(player);
      //     //  console.log(Subscribe);
      //     interaction.reply({ content: text, ephemeral: true });
      //   } else {
      //     interaction.reply({ content: 'Ya no puedo hablar mas :(', ephemeral: true });
      //   }

      // });

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    } else {
      interaction.reply('-_-');
    }



    player.on('stateChange', (oldState, newState) => {
      console.error(`${oldState.status} => ${newState.status}`);
    });

    player.on('error', error => {
      console.error(error);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      //console.error('idle');
    });

    player.on(AudioPlayerStatus.Playing, () => {
      // console.error('playing');
    });

    player.on(AudioPlayerStatus.Buffering, () => {
      // console.error('Buffering');
    });

    player.on(AudioPlayerStatus.AutoPaused, () => {
      // console.error('AutoPaused');
    });

    player.on(AudioPlayerStatus.Paused, () => {
      // console.error('Paused');
    });

    // Subscribe the connection to the audio player (will play audio on the voice connection)

    // subscription could be undefined if the connection is destroyed!
    // if (subscription) {
    //   // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
    //   setTimeout(() => subscription.unsubscribe(), 3_000_000);
    //   setTimeout(() => interaction.reply('Estoy aburrida!'), 300_000);
    // }

    // checking for ending, leaving VC if true
    // player.on(voiceDiscord.AudioPlayerStatus.Idle, () => {
    //     connection.destroy();
    // });

  },
};