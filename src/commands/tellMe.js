const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");
const readlineSync = require("readline-sync");

const googleTTS = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
//const authenticateImplicitWithAdc = require('../authenticateImplicitWithAdc')
var path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { AudioPlayerStatus, NoSubscriberBehavior, joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tellme')
        .setDescription('Answer everithing')
        .addStringOption(option => option.setName('text').setDescription('what ever you want...')),

    async execute(interaction, client) {

        const configuration = new Configuration({
            apiKey: process.env.OPENIA_KEY,

        });

        const openai = new OpenAIApi(configuration);

        const text = interaction.options.getString('text');
        const gtts = new googleTTS.TextToSpeechClient();


        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Idle,
            },
        });

        if (text) {



            const completion = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Que tu respuesta sea breve y corta y nada de codigo o caracteres illegible. ${text}`,
                temperature: 0.7,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,

            });

            console.log(completion.data.choices[0]);


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

            const request = {
                audioConfig: {
                    audioEncoding: "LINEAR16",
                    effectsProfileId: ["headphone-class-device"],
                    pitch: 0,
                    speakingRate: 1
                },
                input: { text: completion.data.choices[0].text },
                voice: {
                    languageCode: "es-US",
                    name: "es-US-Studio-B"
                },
                // audioConfig: { audioEncoding: 'MP3' },
            };

            // Performs the text-to-speech request
            const [response] = await gtts.synthesizeSpeech(request)

            // Write the binary audio content to a local file
            const writeFile = util.promisify(fs.writeFile);
            await writeFile(filepath, response.audioContent, 'binary');

            const resource = createAudioResource(filepath);
            player.play(resource);
            Subscribe = connection.subscribe(player);
            // interaction.reply({ content: 'Talking', ephemeral: true });

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