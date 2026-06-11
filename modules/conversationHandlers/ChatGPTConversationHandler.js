// ChatGPTConversationHandler.js

const IConversationHandler = require('./IConversationHandler');
const OpenAI = require("openai");

class ChatGPTConversationHandler extends IConversationHandler {
    constructor(openaiApiKey) {
        super();
        this.openai = new OpenAI({
            apiKey: openaiApiKey
        });
    }

    async handle(prompt) {
        const completion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: prompt }],
        });
        console.log(completion);

        const textResponse = completion.choices[0].message.content;

        return textResponse;
    }
}

module.exports = ChatGPTConversationHandler;
