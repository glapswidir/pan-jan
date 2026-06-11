const { Porcupine } = require('@picovoice/porcupine-node');
const record = require('node-record-lpcm16');
const EventEmitter = require('events');
const speech = require('@google-cloud/speech');

class VoiceRecognitionModule extends EventEmitter {
    constructor(config, audioDeviceIndex = null) {
        super();
        this.porcupine = new Porcupine(
            config.apiKey,
            config.keywordFilePath,
            config.sensitivity,
            config.porcupineModelPath
        );

        this.audioDeviceIndex = audioDeviceIndex;
        this.isListening = false;
        this.speechClient = new speech.SpeechClient();
        this.commandBuffer = [];
        this.audioStream = null;
        this.silenceThreshold = 100;
        this.silenceDurationThreshold = 10 * 1000; // 5 seconds
        this.silenceDuration = 0;
    }

    startContinuousWakeWordDetection() {
        this.audioStream = record.record({
            sampleRate: 16000,
            channels: 1,
            audioType: 'raw',
            recorder: 'sox',
            device: this.audioDeviceIndex ? `-d ${this.audioDeviceIndex}` : undefined
        }).stream();

        this.audioStream.on('data', async (data) => {
            console.log(this.isListening);

            if (this.isListening === false) {
                 await this.detectWakeWord(data);
            }
            if (this.isListening === true) {
                await this.recordCommand(data);
            }
        });
    }

    async detectWakeWord(data) {
        while (data.length >= this.porcupine.frameLength * 2) {
            const frame = data.slice(0, this.porcupine.frameLength * 2);
            data = data.slice(this.porcupine.frameLength * 2);
            const keywordIndex = this.porcupine.process(
                new Int16Array(frame.buffer, frame.byteOffset, this.porcupine.frameLength)
            );

            if (keywordIndex !== -1) {
                this.emit('wakeWordDetected');
                this.audioStream.pause();
                this.commandBuffer = [];
            }
        }
    }

    isSilent(chunk) {
        let sum = 0;
        for (let i = 0; i < chunk.length; i += 2) {
            sum += Math.abs(chunk.readInt16LE(i));
        }
        let average = sum / (chunk.length / 2);

        return average < this.silenceThreshold; // Define your silence threshold
    }


    async recordCommand(data) {
        this.commandBuffer.push(data);

        if (this.isSilent(data)) {
            this.silenceDuration += data.length / 16;

            if (this.silenceDuration >= this.silenceDurationThreshold) {
                this.isListening = false;
                this.silenceDuration = 0;
                await this.processCommand();
            }
        }
    }

    async processCommand() {
        // Convert the buffer to a single audio file
        const commandData = Buffer.concat(this.commandBuffer);

        const audio = {
            content: commandData.toString('base64'),
        };

        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'pl', // Update this as per your requirement
        };

        const request = {
            audio: audio,
            config: config,
        };

        try {
            const [response] = await this.speechClient.recognize(request);
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');
            console.log(`Transcription: ${transcription}`);
            this.emit('commandRecognized', transcription); // Emit the transcribed command
            this.isListening = false; // Reset the flag
        } catch (error) {
            console.error('Error in Google Speech-to-Text:', error);
            this.isListening = false; // Reset the flag in case of error
        }
    }
}

module.exports = VoiceRecognitionModule;
