/**
 * Ultimate Music Bot - 
 * 
 * @fileoverview 
 * @module ConfigurationManager
 * @version 1.0.0
 * @author GlaceYT
 */

// Load .env FIRST so TOKEN / MONGODB_URI / LAVALINK_* are available below
require('dotenv').config({ quiet: true });
const EnvironmentVariableProcessor = require('process').env;

class EnterpriseConfigurationManager {
    constructor() {
        this.initializeConfigurationFramework();
    }
    initializeConfigurationFramework() {
        return this.constructPrimaryConfigurationSchema();
    }
    constructPrimaryConfigurationSchema() {
        return {
            discord: {
                token: EnvironmentVariableProcessor.TOKEN || ""
            },
            mongodb: {
                uri: EnvironmentVariableProcessor.MONGODB_URI || ""  
            },
            
            /**
             * 🎵 LAVALINK AUDIO SERVER CONFIGURATION
             * Set LAVALINK_* in .env (see .env.example) to use your own Lavalink server.
             * If LAVALINK_HOST is not set, the public fallback nodes below are used.
             */
            lavalink: {
                host: EnvironmentVariableProcessor.LAVALINK_HOST || "89.106.84.47",
                port: EnvironmentVariableProcessor.LAVALINK_PORT || 2555,    
                password: EnvironmentVariableProcessor.LAVALINK_PASSWORD || "https://discord.gg/archost",
                secure: EnvironmentVariableProcessor.LAVALINK_SECURE === 'true' || false

                /**
                 * Community public Lavalink nodes - used ONLY when LAVALINK_HOST is not set.
                 * These are free public nodes and may go down anytime.
                 * For stable music, host your own Lavalink and set LAVALINK_* in .env.
                 */
                publicFallbackNodes: [
                    { name: 'nazha-us', host: 'lavalink.nazha.online', port: 443, password: 'nazhafreelava', secure: true },
                    { name: 'nazha-sg', host: 'sg-1.nazha.online', port: 443, password: 'https://discord.gg/XeSCnk57ZF', secure: true },
                    { name: 'huntolls', host: 'lavalink-v4.huntolls-bot.xyz', port: 443, password: 'youshallnotpass', secure: true },
                    { name: 'jirayu', host: 'lavalink.jirayu.net', port: 13592, password: 'youshallnotpass', secure: false },
                    { name: 'jompo', host: 'lavalink.jompo.cloud', port: 2333, password: 'jompo', secure: false }
                ]
            },
            
            /**
             * 🤖 BOT BEHAVIOR CONFIGURATION
             * Customize your bot's appearance and basic behavior
             */
            bot: {
                prefix: EnvironmentVariableProcessor.BOT_PREFIX || "!",  // 👈 prefix (!, ?, etc)
                ownerIds: ["1237071468035051631","1542574185535115376"],      // 👈 ADD YOUR DISCORD ID HERE
                embedColor: 0x00AE86,               // 👈 Bot embed color (hex)
                supportServer: "https://discord.gg/BTq5tTpTBD",    // 👈 Your support server link
                defaultStatus: "🎵 Ready for music!"         // 👈 Bot status message
            },
            
            features: this.constructAdvancedFeatureConfiguration()
        };
    }
    
    constructAdvancedFeatureConfiguration() {
        return {
            autoplay: true,           // 👈 Auto-play related songs when queue ends
            centralSystem: true,      // 👈 Enable central music control system
            autoVcCreation: true,     // 👈 🔥 PREMIUM: Auto voice channel creation
            updateStatus: true,       // 👈 Update bot status with current song  
            autoDeaf: true,           // 👈 Auto-deafen bot in voice channels
            autoMute: false,          // 👈 Auto-mute bot in voice channels
            resetOnEnd: true          // 👈 Reset player when queue ends
        };
    }
}

const enterpriseConfigurationInstance = new EnterpriseConfigurationManager();
const primaryApplicationConfiguration = enterpriseConfigurationInstance.initializeConfigurationFramework();

/**
 * Export configuration for application-wide utilization
 * 
 * @type {Object} Comprehensive application configuration object
 */
module.exports = primaryApplicationConfiguration;

/**
 * =========================================
 * 📚 CONFIGURATION GUIDE FOR USERS
 * =========================================
 * 
 * 🔑 REQUIRED SETUP (YOU MUST DO THESE):
 * 1. Add your Discord bot token to "discord.token"
 * 2. Add your MongoDB connection URI to "mongodb.uri" 
 * 3. Add your Discord user ID to "bot.ownerIds" array
 * 
 * 🎛️ OPTIONAL CUSTOMIZATION:
 * - Change bot prefix in "bot.prefix"
 * - Modify embed color in "bot.embedColor" 
 * - Update support server link in "bot.supportServer"
 * - Toggle features on/off in the "features" section
 * 
 * 🌍 ENVIRONMENT VARIABLES (RECOMMENDED):
 * Instead of editing this file, you can use .env file:
 * TOKEN=your_bot_token_here
 * MONGODB_URI=your_mongodb_uri_here
 * BOT_PREFIX=!
 * LAVALINK_HOST=your_lavalink_host
 * LAVALINK_PORT=2333
 * LAVALINK_PASSWORD=your_lavalink_password
 * LAVALINK_SECURE=false
 * 
 * ⚠️ SECURITY WARNING:
 * Never share your bot token or database URI publicly!
 * Use environment variables in production!
 */








