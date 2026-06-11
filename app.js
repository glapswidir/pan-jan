require('dotenv').config();
const VoiceRecognitionModule = require('./modules/voiceRecognition/VoiceRecognitionModule');
const CommandInterpreter = require('./modules/commandInterpreter/CommandInterpreter');
const VoiceResponse = require('./modules/responseHandlers/VoiceResponse');
const ChatGPTConversationHandler = require('./modules/conversationHandlers/ChatGPTConversationHandler');

const configVRM = {
    apiKey: process.env.PICOVOICE_API,
    porcupineModelPath:'/Users/wjarosz/PhpstormProjects/jan/assets/porcupine_params_pl.pv',
    keywordFilePath: ["/Users/wjarosz/PhpstormProjects/jan/assets/moj-janie_pl_mac_v3_0_0.ppn"],
    sensitivity: [0.5]
}
const configVR = {
    apiKey:  process.env.ELEVEN_LABS_API_KEY,
    voiceId:  process.env.ELEVEN_LABS_VOICE_ID,
}

const openaiApiKey = process.env.OPENAI_API_KEY;

const voiceRecognition = new VoiceRecognitionModule(configVRM);

const voiceResponse = new VoiceResponse(configVR);

const chatGPTHandler = new ChatGPTConversationHandler(openaiApiKey);

const commandInterpreter = new CommandInterpreter([voiceResponse], chatGPTHandler);


voiceRecognition.on('commandRecognized', async (transcription) => {
    console.log('Command recognized:', transcription);
    await commandInterpreter.processCommand(transcription);
});

voiceRecognition.on('wakeWordDetected', async () => {
    await voiceResponse.speak('Jak mogę ci służyć?');

    delay(5000).then(() => {
        voiceRecognition.audioStream.resume();
        console.log('reasuming');
        voiceRecognition.isListening = true;
    });

});

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

voiceRecognition.startContinuousWakeWordDetection(); // Start the voice recognition process
