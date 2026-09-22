/**
 * Discord Client Ready Event Handler
 * 
 * @fileoverview 
 * @version 1.0.0
 * @author GlaceYT
 */

const DiscordRESTClientManager = require('discord.js').REST;
const DiscordApplicationRoutesRegistry = require('discord.js').Routes;
const SystemConfigurationManager = require('../config');
const FileSystemOperationalInterface = require('fs');
const SystemPathResolutionUtility = require('path');
const CentralEmbedManagementSystem = require('../utils/centralEmbed');

/**
 * Discord Client Ready Event Configuration
 * Implements comprehensive client initialization with advanced startup procedures
 */
module.exports = {
    name: 'clientReady',
    once: true,
    
    /**
     * Execute comprehensive client ready initialization sequence
     * 
     * Orchestrates complete bot startup with system validation, command registration,
     * and service initialization procedures for optimal performance.
     * 
     * @param {Client} client - Discord client runtime instance
     */
    async execute(client) {
        const clientInitializationManager = new ClientInitializationManager(client);
        await clientInitializationManager.executeComprehensiveStartupSequence();
    }
};

/**
 * Enterprise Client Initialization Management System
 * Coordinates comprehensive bot startup procedures with advanced error handling
 */
class ClientInitializationManager {
    /**
     * Initialize client startup management system
     * @param {Client} clientInstance - Discord client runtime instance
     */
    constructor(clientInstance) {
        this.clientRuntimeInstance = clientInstance;
        this.startupTimestamp = Date.now();
        this.initializationStatus = {
            audioSystemReady: false,
            commandsRegistered: false,
            embedSystemReady: false,
            statusSystemReady: false
        };
    }
    
    /**
     * Execute comprehensive startup sequence with advanced monitoring
     * 
     * Coordinates all critical initialization procedures with performance tracking
     * and comprehensive error handling for optimal system reliability.
     */
    async executeComprehensiveStartupSequence() {
        try {

            this.executeStartupNotificationProcedures();
            
            await this.initializeAudioProcessingSubsystem();
            
            await this.executeCommandRegistrationProcedures();

            await this.initializeEmbedManagementSubsystem();

            await this.activateStatusManagementSystem();

            this.validateStartupSequenceCompletion();
            
        } catch (initializationException) {
            this.handleInitializationFailure(initializationException);
        }
    }
    
    /**
     * Execute startup notification procedures with system information
     */
    executeStartupNotificationProcedures() {
        console.log(`🎵 ${this.clientRuntimeInstance.user.tag} is online and ready!`);
        console.log(`🆔 Client ID: ${this.clientRuntimeInstance.user.id}`);
    }
    
    /**
     * Initialize comprehensive audio processing subsystem
     * 
     * Activates Riffy audio framework with client integration and validation
     */
    async initializeAudioProcessingSubsystem() {
        try {
            this.clientRuntimeInstance.riffy.init(this.clientRuntimeInstance.user.id);
            this.initializationStatus.audioSystemReady = true;

            // Verify Lavalink connectivity shortly after startup (nodes connect async)
            setTimeout(() => {
                const connectedNodes = this.clientRuntimeInstance.riffy?.leastUsedNodes?.length || 0;
                if (connectedNodes === 0) {
                    console.warn('⚠️ WARNING: No Lavalink node is connected! Music and join commands will NOT work.');
                    console.warn('👉 Fix: set LAVALINK_HOST / LAVALINK_PORT / LAVALINK_PASSWORD / LAVALINK_SECURE in .env (see .env.example) and restart.');
                } else {
                    console.log(`🎵 ${connectedNodes} Lavalink node(s) connected - music ready`);
                }
            }, 10000);

        } catch (audioInitializationException) {
            console.error('❌ Audio system initialization failed:', audioInitializationException);
            throw audioInitializationException;
        }
    }
    
    /**
     * Execute comprehensive command registration procedures
     * 
     * Discovers, validates, and registers all slash commands with Discord API
     */
    async executeCommandRegistrationProcedures() {
        const commandRegistrationService = new SlashCommandRegistrationService(this.clientRuntimeInstance);
        const registrationResult = await commandRegistrationService.executeCommandDiscoveryAndRegistration();
        
        this.initializationStatus.commandsRegistered = registrationResult.success;
    }
    
    /**
     * Initialize comprehensive embed management subsystem
     * 
     * Activates central embed management with startup reset procedures
     */
    async initializeEmbedManagementSubsystem() {
        try {
            const centralEmbedManager = new CentralEmbedManagementSystem(this.clientRuntimeInstance);
            await centralEmbedManager.resetAllCentralEmbedsOnStartup();
            this.initializationStatus.embedSystemReady = true;
            
        } catch (embedSystemException) {
            console.error('❌ Embed system initialization failed:', embedSystemException);
            this.initializationStatus.embedSystemReady = false;
        }
    }
    
    /**
     * Activate comprehensive status management system
     * 
     * Initializes bot status with server count and activity management
     */
    async activateStatusManagementSystem() {
        try {
            await this.clientRuntimeInstance.statusManager.setServerCountStatus(
                this.clientRuntimeInstance.guilds.cache.size
            );
            this.initializationStatus.statusSystemReady = true;
        } catch (statusSystemException) {
            console.error('❌ Status system initialization failed:', statusSystemException);
            // Non-critical failure - continue startup
            this.initializationStatus.statusSystemReady = false;
        }

        try {
            const { ActivityType } = require('discord.js');
            await this.clientRuntimeInstance.user.setPresence({
                activities: [{ name: '🎵 Developed by JOy', type: ActivityType.Watching }],
                status: 'online'
            });
            console.log('🪪 Initial RPC set: 🎵 Developed by JOy');
        } catch (initialRpcError) {
            console.error('❌ Initial RPC set failed', initialRpcError.message);
        }
    }
    
    /**
     * Validate comprehensive startup sequence completion
     * 
     * Performs final validation of all initialization procedures and system health
     */
    validateStartupSequenceCompletion() {
        const initializationDuration = Date.now() - this.startupTimestamp;
        const criticalSystemsOnline = this.initializationStatus.audioSystemReady && 
                                     this.initializationStatus.commandsRegistered;
        
        if (criticalSystemsOnline) {
            console.log(`✅ Bot initialization completed successfully in ${initializationDuration}ms`);
        } else {
            console.warn('⚠️ Bot started with some subsystem failures');
        }
    }
    
    /**
     * Handle initialization failures with comprehensive error reporting
     */
    handleInitializationFailure(initializationException) {
        console.error('💥 Critical initialization failure:', initializationException);
        // Continue operation in degraded mode rather than crashing
    }
}

/**
 * Enterprise Slash Command Registration Service
 * Manages comprehensive command discovery and Discord API registration
 */
class SlashCommandRegistrationService {
    /**
     * Initialize command registration service
     * @param {Client} clientInstance - Discord client runtime instance  
     */
    constructor(clientInstance) {
        this.clientRuntimeInstance = clientInstance;
        this.discoveredCommands = [];
        this.registrationSuccess = false;
    }
    
    /**
     * Execute comprehensive command discovery and registration sequence
     * 
     * @returns {Object} Registration result with success status and metrics
     */
    async executeCommandDiscoveryAndRegistration() {
        try {
    
            await this.executeCommandDiscoveryProcedures();
            
      
            await this.executeDiscordAPIRegistration();
            
            return {
                success: this.registrationSuccess,
                commandCount: this.discoveredCommands.length
            };
            
        } catch (registrationException) {
            console.error('❌ Command registration failed:', registrationException);
            return {
                success: false,
                commandCount: 0,
                error: registrationException.message
            };
        }
    }
    

    async executeCommandDiscoveryProcedures() {
        const slashCommandDirectoryPath = SystemPathResolutionUtility.join(__dirname, '..', 'commands', 'slash');
        
        if (FileSystemOperationalInterface.existsSync(slashCommandDirectoryPath)) {
            const discoveredCommandFiles = FileSystemOperationalInterface
                .readdirSync(slashCommandDirectoryPath)
                .filter(fileEntity => fileEntity.endsWith('.js'));
            
            for (const commandFile of discoveredCommandFiles) {
                const commandModuleInstance = require(SystemPathResolutionUtility.join(slashCommandDirectoryPath, commandFile));
                this.discoveredCommands.push(commandModuleInstance.data.toJSON());
            }
        }
    }
    
    /**
     * Execute Discord API registration with comprehensive error handling
     */
    async executeDiscordAPIRegistration() {
        const discordRESTClient = new DiscordRESTClientManager()
            .setToken(SystemConfigurationManager.discord.token || process.env.TOKEN);
        const applicationId = this.clientRuntimeInstance.user.id;
        const commandBody = this.discoveredCommands;

        console.log('🔄 Started refreshing slash commands...');

        // Global registration keeps commands available everywhere. Guild registration
        // is intentionally done as well so new commands appear instantly in each guild.
        await discordRESTClient.put(
            DiscordApplicationRoutesRegistry.applicationCommands(applicationId),
            { body: commandBody }
        );

        let failedGuildRegistrations = 0;
        const guilds = [...this.clientRuntimeInstance.guilds.cache.values()];
        for (const guild of guilds) {
            try {
                await discordRESTClient.put(
                    DiscordApplicationRoutesRegistry.applicationGuildCommands(applicationId, guild.id),
                    { body: commandBody }
                );
            } catch (guildRegistrationError) {
                failedGuildRegistrations++;
                console.error(
                    `❌ Command registration failed for guild "${guild.name}" (${guild.id}): ${guildRegistrationError.message}`
                );
            }
        }

        this.registrationSuccess = true;
        const failureSuffix = failedGuildRegistrations > 0
            ? ` +${failedGuildRegistrations} failed`
            : '';
        console.log(
            `✅ Slash commands registered: ${guilds.length} guild(s) instant${failureSuffix} + global`
        );
    }
}
