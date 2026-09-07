class ErrorHandler {
    static handle(error, context = 'unknown') {
        console.error(`❌ Error in ${context}:`, error.message);
        
   
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack);
        }
    }
    
    static async safeExecute(operation, fallback = null, context = 'operation') {
        try {
            return await operation();
        } catch (error) {
            this.handle(error, context);
            return fallback;
        }
    }
    
    static safeReact(message, emoji = '❌') {
        message.react(emoji).catch(() => {});
    }
}

module.exports = ErrorHandler;
