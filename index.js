require("dotenv").config();
const fs = require("fs");
const ElevenLabs = require("elevenlabs-node");
const player = require("play-sound")((opts = {}));
const OpenAI = require("openai");
const readline = require("readline");
const { Porcupine } = require("@picovoice/porcupine-node");
const record = require('node-record-lpcm16');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const handle = new Porcupine(
    process.env.PICOVOICE_API,
    ["/Users/wjarosz/PhpstormProjects/jan/assets/moj-janie_pl_mac_v3_0_0.ppn"],
    [0.5],
    '/Users/wjarosz/PhpstormProjects/jan/assets/porcupine_params_pl.pv',
);

const audioStream = record.record({
    sampleRate: 16000,
    channels: 1,
    audioType: 'raw',
    recorder: 'sox', // Specify SoX as the recorder
}).stream();

let buffer = Buffer.alloc(0);

audioStream.on('data', (data) => {
    // Append new data to buffer
    buffer = Buffer.concat([buffer, data]);

    while (buffer.length >= handle.frameLength * 2) {
        // Extract an audio frame from the buffer
        const frame = buffer.slice(0, handle.frameLength * 2);
        buffer = buffer.slice(handle.frameLength * 2);

        // Convert buffer to Int16Array
        const audioFrame = new Int16Array(frame.buffer, frame.byteOffset, handle.frameLength);

        // Process the audio frame
        const keywordIndex = handle.process(audioFrame);
        if (keywordIndex !== -1) {
            console.log("Wake word detected!");
            // Handle wake word detection
        }
    }
});


const run = async () => {
    rl.question("Please enter your prompt: ", async (prompt) => {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: prompt }],
        });

        const textResponse = completion.choices[0].message.content.trim();

        console.log(textResponse);

        const voice = new ElevenLabs(
            {
                apiKey:  process.env.ELEVEN_LABS_API_KEY,
                voiceId:  process.env.ELEVEN_LABS_VOICE_ID,
            }
        );
        voice.textToSpeechStream({
            fileName:  "audio.mp3",                    // The name of your audio file
            textInput: textResponse,
            modelId:   "eleven_multilingual_v2"
        }).then((res) => {
                res.pipe(fs.createWriteStream("audio.mp3")).on("finish", () => {
                    player.play("audio.mp3", (err) => {
                        if (err) throw err;
                    });
                });
            });

        rl.close();
    });
};

run();
