const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const readlineSync = require("readline-sync");
const { LMStudioClient, Chat } = require('@lmstudio/sdk');
const googleTTS = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
var path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const { AudioPlayerStatus, NoSubscriberBehavior, joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tellme')
        .setDescription('Answer everithing')
        .addStringOption(option => option.setName('text').setDescription('what ever you want...')),

    async execute(interaction, client) {
        function escaparYFormatearJSON(cadena) {
            try {
                const obj = JSON.parse(cadena.replace(/<\|[^>]+?\|>/g, '').replace(/\bassistantfinal\b/gi, '').trim());
                const jsonFormateado = JSON.stringify(obj, null, 2);

                return { jsonFormateado, obj };
            } catch (e) {
                // Si no es un JSON válido, escapar el texto tal cual

                const obj = JSON.parse('{"error": "No se pudo formatear el JSON", "resumen":""}');
                const jsonFormateado = JSON.stringify(obj, null, 2);
                return { jsonFormateado, obj }
            }
        }
        try {
            const lmsClient = new LMStudioClient();
            const model = await lmsClient.llm.model("openai/gpt-oss-20b");

            const text = interaction.options.getString('text');
            const gtts = new googleTTS.TextToSpeechClient();

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Idle,
                },
            });

            if (text) {
                await interaction.deferReply({ ephemeral: true }); // Responde rápido para evitar timeout

                const chat = Chat.empty();
                chat.append("user", text);

                const prediction = model.respond(chat);

                let _text = '🧠. ';

                for await (const part of prediction) {

                    const regexTags = /<\|[^>]+?\|>/g;
                    if (!regexTags.test(part.content)) {
                        _text += part.content;
                    }

                    console.log(part);
                    await interaction.editReply({ content: _text });
                }
                console.log('\n-----------------------------^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^-----------------------------\n');

                const result = await prediction.result();

                console.log('resultado ', result);

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


                // const finalText = `${result.reasoningContent} \n \`\`\`json\n${result.nonReasoningContent.replace(/<\|[^>]+?\|>/g, '').replace(/\bassistantfinal\b/gi, '').trim()}\n\`\`\``;
                const jsonFormateado = escaparYFormatearJSON(result.nonReasoningContent);
                const finalText = `${result.reasoningContent} \n \`\`\`json\n${jsonFormateado.jsonFormateado}\n\`\`\``;

                //result.reasoningContent + ' \n\n ' + result.nonReasoningContent.replace(/<\|[^>]+?\|>/g, '').replace(/\bassistantfinal\b/gi, '').trim();

                const request = {
                    audioConfig: {
                        audioEncoding: "LINEAR16",
                        effectsProfileId: ["headphone-class-device"],
                        pitch: 0,
                        speakingRate: 1
                    },
                    input: { text: result.reasoningContent },
                    voice: {
                        // languageCode: "es-US",
                        // name: "es-US-Studio-B"
                        languageCode: "en-US",
                        name: "en-us-Chirp3-HD-Leda",
                    },
                    // audioConfig: { audioEncoding: 'MP3' },
                };

                let filepath = path.join(__dirname, `../speech/Analysis_completed.mp3`);

                if (result.reasoningContent != '') {
                    filepath = path.join(__dirname, `../speech/${channel.id}.mp3`);
                    const [response] = await gtts.synthesizeSpeech(request)
                    const writeFile = util.promisify(fs.writeFile);
                    await writeFile(filepath, response.audioContent, 'binary');
                }

                const resource = createAudioResource(filepath);
                player.play(resource);
                Subscribe = connection.subscribe(player);

                console.log('jsonResult', jsonFormateado.obj);
                const resultEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('Analysis completed')
                    .setDescription(jsonFormateado.obj.resumen && jsonFormateado.obj.resumen.length > 0 ? jsonFormateado.obj.resumen : 'Sin resumen disponible.')
                    .addFields(
                        { name: 'Json Result', value: finalText },
                        { name: '\u200B', value: '\u200B' },
                        { name: 'Model', value: result.modelInfo.displayName, inline: true },
                        { name: 'Tokens per second', value: result.stats.tokensPerSecond.toString(), inline: true }, 
                        { name: 'Prompt token count', value: result.stats.promptTokensCount.toString(), inline: true }, 
                    )
                    .setTimestamp();

                await interaction.channel.send({ embeds: [resultEmbed] });

                await interaction.editReply({ content: finalText });


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

        } catch (error) {
            console.error('Error en tellMe:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Ocurrió un error procesando tu solicitud.' });
            } else {
                await interaction.reply({ content: 'Ocurrió un error procesando tu solicitud.', ephemeral: true });
            }
        }
    },

};