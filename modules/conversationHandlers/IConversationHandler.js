class IConversationHandler {
    async handle(prompt) {
        throw new Error("Handle method not implemented");
    }
}

module.exports = IConversationHandler;
