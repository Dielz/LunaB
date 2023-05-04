const { SlashCommandBuilder } = require('discord.js');
const { VoiceConnectionStatus, joinVoiceChannel } = require('@discordjs/voice');

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

    const connection = joinVoiceChannel({
      // debug: true,
      selfDeaf: false,
      selfMute: false,
      channelId: channel.id,
      guildId: interaction.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,//interaction.guild.voiceAdapterCreator,
    });

    // connection.on('debug', (m) => {
    //   console.log('Voice Debug:', m);
    // });

    connection.on('stateChange', (old_state, new_state) => {
      console.log('join', 'Connection state change from', old_state.status, 'to', new_state.status)
      // if (old_state.status === VoiceConnectionStatus.Ready && new_state.status === VoiceConnectionStatus.Connecting) {
      //   connection.configureNetworking();
      // }
    })

    interaction.reply({ content: 'Hello!!', ephemeral: true });
   // return connection;



  },
};