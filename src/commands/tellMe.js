const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { LMStudioClient, Chat } = require('@lmstudio/sdk');
const { pipeline } = require('@xenova/transformers');
const googleTTS = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require('path');
const { AudioPlayerStatus, NoSubscriberBehavior, joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Configura tu supabase
const supabaseUrl = process.env.SUPABASE_URL; // Ej: https://xxxx.supabase.co
const supabaseKey = process.env.SUPABASE_KEY; // tu anon o servicio key
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para buscar categorías relevantes
async function buscarCategoria(text, limit = 1) {
    // Crear embedder
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    // Obtener embedding del texto del usuario
    const embeddingResult = await embedder(text, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(embeddingResult.data);
    // Buscar categoría más cercana en Supabase (llamando función RPC)
    const { data: categorias, error } = await supabase.rpc('match_categoria', {
        query_embedding: queryEmbedding,
        match_count: limit
    });

    if (error) {
        console.error('Error buscando categoría en Supabase:', error);
        await interaction.editReply('Error buscando categoría en la base de datos.');
        return;
    }



    // let categoriaSugerida = categorias && categorias.length > 0 ? categorias[0].nombre : 'DOCUMENTO';
    // let categoriaId = categorias && categorias.length > 0 ? categorias[0].id : 7;

    categorias && categorias.length > 0 ? categorias : [{ nombre: 'DOCUMENTO', id: 7 }];

    let _categoriasSugeridas = categorias.map(c => {
        return { nombre: c.nombre, id: c.id };
    });
    let cat = JSON.stringify(_categoriasSugeridas).replace(/},/g, '},\n')
    console.log(cat);

    return cat; 
}

async function escaparYFormatearJSON(cadena) {
    try {
        const obj = JSON.parse(cadena.replace(/<\|[^>]+?\|>/g, '').replace(/\bassistantfinal\b/gi, '').trim());
        const jsonFormateado = JSON.stringify(obj, null, 2);
        // console.log('\n\nJSON formateado:', jsonFormateado);
        return { jsonFormateado, obj };
    } catch (e) {
        // Si no es un JSON válido, escapar el texto tal cual

        console.log('escaparYFormatearJSON', e)
        const obj = JSON.parse('{"error": "No se pudo formatear el JSON", "resumen":""}');
        const jsonFormateado = JSON.stringify(obj, null, 2);
        // console.error('\n\nError al formatear JSON:', jsonFormateado);
        return { jsonFormateado, obj }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tellme')
        .setDescription('Answer everithing')
        .addStringOption(option => option.setName('text').setDescription('what ever you want...')),

    async execute(interaction, client) {

        try {
            await interaction.deferReply({ ephemeral: true }); // Responde rápido para evitar timeout

            const lmsClient = new LMStudioClient();
            const model = await lmsClient.llm.model("openai/gpt-oss-20b");
            const text = interaction.options.getString('text');

            if (!text) {
                await interaction.editReply('Por favor envía un texto para analizar.');
                return;
            }

            let categoriasSugeridas = await buscarCategoria(text, 80);

            // Construir prompt para LM Studio incluyendo la categoría sugerida
            const promptUser = `5. Categorías sugeridas para este documento:\n ${categoriasSugeridas}.\n\n${text}`;

            //  console.log('Prompt para LM Studio:', promptUser);
            const chat = Chat.empty();
            chat.append("user", promptUser);

            const prediction = model.respond(chat);

            let _text = '🧠. ';
            for await (const part of prediction) {

                const regexTags = /<\|[^>]+?\|>/g;
                if (!regexTags.test(part.content)) {
                    _text += part.content;
                }

                //console.log(part.content);
                process.stdout.write(part.content);
                await interaction.editReply({ content: _text });
            }


            const result = await prediction.result();
            const jsonFormateado = await escaparYFormatearJSON(result.nonReasoningContent);

            console.log('resultado ', result);

            // Reproducir audio y enviar embed igual que antes
            const gtts = new googleTTS.TextToSpeechClient();
            const channel = interaction.member.voice.channel;
            if (!channel) {
                await interaction.channel.send('Por favor, únase a un canal de voz primero.');
                return;
            }

            const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Idle } });
            const voiceChannel = client.channels.cache.get(channel.id);
            const connection = joinVoiceChannel({
                selfDeaf: false,
                selfMute: false,
                channelId: channel.id,
                guildId: interaction.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

          
            const request = {
                audioConfig: {
                    audioEncoding: "LINEAR16",
                    effectsProfileId: ["headphone-class-device"],
                    pitch: 0,
                    speakingRate: 1
                },
                input: { text: jsonFormateado.obj.resumen },
                voice: {
                    // languageCode: "es-US",
                    // name: "es-US-Studio-B"
                    languageCode: "es-US",
                    name: "es-us-Chirp3-HD-Algenib",
                },
                // audioConfig: { audioEncoding: 'MP3' },
            };

            let filepath = path.join(__dirname, `../speech/Analysis_completed.mp3`);

            if (jsonFormateado.obj.resumen != '') {
                filepath = path.join(__dirname, `../speech/${channel.id}.mp3`);
                const [response] = await gtts.synthesizeSpeech(request)
                const writeFile = util.promisify(fs.writeFile);
                await writeFile(filepath, response.audioContent, 'binary');
            }

            const resource = createAudioResource(filepath);
            player.play(resource);
            Subscribe = connection.subscribe(player);

            const finalText = `${result.reasoningContent} \n \`\`\`json\n${jsonFormateado.jsonFormateado}\n\`\`\``;
            // const categorias = `\`\`\`json\n${categoriasSugeridas}\n\`\`\``;

            // console.log('jsonResult', jsonFormateado.obj);
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

            // Manejo eventos audio player...
            player.on('error', error => console.error(error));
            player.on(AudioPlayerStatus.Idle, () => { /* desconectar o limpiar si quieres */ });


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