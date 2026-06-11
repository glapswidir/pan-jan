const ElevenLabs = require("elevenlabs-node");
const player = require("play-sound")((opts = {}));
const fs = require("fs");

class VoiceResponse {
    constructor(config) {
        this.voice = new ElevenLabs(config);
    }

    async speak(text) {
        try {
            const response = await this.voice.textToSpeechStream({
                fileName: "audio.mp3",
                textInput: text,
                modelId: "eleven_multilingual_v2"
            });

            response.pipe(fs.createWriteStream("audio.mp3")).on("finish", () => {
                player.play("audio.mp3", (err) => {
                    if (err) {
                        console.error("Error playing the audio:", err);
                    }
                });
            });
        } catch (error) {
            console.error("Error in VoiceResponse:", error);
        }
    }
}

module.exports = VoiceResponse;
