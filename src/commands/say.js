const { SlashCommandBuilder } = require('discord.js');
const eleven = require('elevenlabs-node');
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

      // connection.on('stateChange', (old_state, new_state) => {
      //   console.log('join', 'Connection state change from', old_state.status, 'to', new_state.status)
      //   // if (old_state.status === VoiceConnectionStatus.Ready && new_state.status === VoiceConnectionStatus.Connecting) {
      //   //   connection.configureNetworking();
      //   // }
      // })

      eleven.textToSpeechStream(process.env.ELEVEN_KEY, voice, `${text}.`, 0.60, 0.55).then(res => {

        if (res) {
          console.info('eleven trabajando')
          const resource = createAudioResource(res);
          player.play(resource);
          Subscribe = connection.subscribe(player);
          //  console.log(Subscribe);
          interaction.reply({ content: text, ephemeral: true });
        } else {
          interaction.reply({ content: 'Ya no puedo hablar mas :(', ephemeral: true });
        }

      }, (reason) => {

        console.error(reason);
        interaction.reply({ content: reason, ephemeral: true });
      });



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