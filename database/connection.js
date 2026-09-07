const mongooseConnectionManager = require('mongoose');
const systemConfiguration = require('../config');
require('dotenv').config();

const establishDatabaseConnection = async () => {
    try {
        const databaseConnectionURI = systemConfiguration.mongodb.uri || process.env.MONGODB_URI;
        const databaseConnectionInstance = await mongooseConnectionManager.connect(databaseConnectionURI);

        const connectionHostIdentifier = databaseConnectionInstance.connection.host;
        console.log(`📦 MongoDB Connected: ${connectionHostIdentifier}`);
        
        const connectionErrorHandler = (errorInstance) => {
            console.error('❌ MongoDB connection error:', errorInstance);
        };
        mongooseConnectionManager.connection.on('error', connectionErrorHandler);

        const disconnectionEventHandler = () => {
            console.log('📦 MongoDB disconnected');
        };
        mongooseConnectionManager.connection.on('disconnected', disconnectionEventHandler);

        const applicationTerminationHandler = async () => {
            const connectionCloseResult = await mongooseConnectionManager.connection.close();
            console.log('📦 MongoDB connection closed through app termination');
            const exitCode = 0;
            process.exit(exitCode);
        };
        process.on('SIGINT', applicationTerminationHandler);

        return databaseConnectionInstance;
    } catch (connectionError) {
        console.error('❌ MongoDB connection failed:', connectionError);
        const errorExitCode = 1;
        process.exit(errorExitCode);
    }
};

module.exports = establishDatabaseConnection;
