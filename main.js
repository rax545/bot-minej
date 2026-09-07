/**
 * Ultimate Music Bot 
 * Comprehensive Discord Bot
 * 
 * @fileoverview Core application
 * @version 1.0.0
 * @author GlaceYT
 */

const DiscordClientFramework = require('discord.js').Client;
const DiscordGatewayIntentBitsRegistry = require('discord.js').GatewayIntentBits;
const DiscordCollectionFramework = require('discord.js').Collection;
const RiffyAudioProcessingFramework = require('riffy').Riffy;
const FileSystemOperationalInterface = require('fs');
const SystemPathResolutionUtility = require('path');
const SystemConfigurationManager = require('./config');
const DatabaseConnectionEstablishmentService = require('./database/connection');
const AudioPlayerManagementHandler = require('./utils/player');
const ApplicationStatusManagementService = require('./utils/statusManager');
const MemoryGarbageCollectionOptimizer = require('./utils/garbageCollector');
const EnvironmentVariableConfigurationLoader = require('dotenv');
const shiva = require('./shiva');
// Initialize environment variable configuration subsystem
EnvironmentVariableConfigurationLoader.config();

/**
 * Discord Client Runtime Management System
 * Implements comprehensive client lifecycle management with advanced intent configuration
 */
class DiscordClientRuntimeManager {
    constructor() {
        this.initializeClientConfiguration();
        this.initializeRuntimeSubsystems();
        this.initializeAudioProcessingInfrastructure();
        this.initializeApplicationBootstrapProcedures();
    }
    
    /**
     * Initialize primary Discord client
     * Implements comprehensive gateway intent management for optimal resource utilization
     */
    initializeClientConfiguration() {
        this.clientRuntimeInstance = new DiscordClientFramework({
            intents: [
                DiscordGatewayIntentBitsRegistry.Guilds,
                DiscordGatewayIntentBitsRegistry.GuildMessages,
                DiscordGatewayIntentBitsRegistry.GuildVoiceStates,
                DiscordGatewayIntentBitsRegistry.GuildMessageReactions,
                DiscordGatewayIntentBitsRegistry.MessageContent,
                DiscordGatewayIntentBitsRegistry.DirectMessages,
                DiscordGatewayIntentBitsRegistry.GuildPresences
            ]
        });
        
        // Initialize command collection management subsystems
        this.clientRuntimeInstance.commands = new DiscordCollectionFramework();
        this.clientRuntimeInstance.slashCommands = new DiscordCollectionFramework();
        this.clientRuntimeInstance.mentionCommands = new DiscordCollectionFramework();
    }
    
    /**
     * Initialize core runtime subsystem managers with dependency injection pattern
     * Ensures proper initialization order for optimal system performance
     */
    initializeRuntimeSubsystems() {
        // Dependency injection pattern for status management subsystem
        this.statusManagementSubsystem = new ApplicationStatusManagementService(this.clientRuntimeInstance);
        this.clientRuntimeInstance.statusManager = this.statusManagementSubsystem;
        
        // Dependency injection pattern for audio player management subsystem  
        this.audioPlayerManagementSubsystem = new AudioPlayerManagementHandler(this.clientRuntimeInstance);
        this.clientRuntimeInstance.playerHandler = this.audioPlayerManagementSubsystem;
    }
    
    /**
     * Initialize advanced audio processing infrastructure with Riffy framework integration
     * Implements Lavalink node configuration and management
     */
    initializeAudioProcessingInfrastructure() {
        const audioNodeConfigurationRegistry = this.constructAudioNodeConfiguration();
        
        this.audioProcessingRuntimeInstance = new RiffyAudioProcessingFramework(
            this.clientRuntimeInstance, 
            audioNodeConfigurationRegistry, 
            {
                send: (audioPayloadTransmissionData) => {
                    const guildContextResolution = this.clientRuntimeInstance.guilds.cache
                        .get(audioPayloadTransmissionData.d.guild_id);
                    if (guildContextResolution) {
                        guildContextResolution.shard.send(audioPayloadTransmissionData);
                    }
                },
                defaultSearchPlatform: "ytmsearch",
                restVersion: "v4"
            }
        );
        
        this.clientRuntimeInstance.riffy = this.audioProcessingRuntimeInstance;
    }
    
    /**
     * Construct audio node configuration from system configuration
     * Implements secure credential management and connection parameter optimization
     */
    constructAudioNodeConfiguration() {
        const systemConfiguration = SystemConfigurationManager;
        
        return [
            {
                host: systemConfiguration.lavalink.host,
                password: systemConfiguration.lavalink.password,
                port: systemConfiguration.lavalink.port,
                secure: systemConfiguration.lavalink.secure
            }
        ];
    }
    
    /**
     * Initialize comprehensive application bootstrap procedures
     * Orchestrates system initialization sequence with error handling and logging
     */
    initializeApplicationBootstrapProcedures() {
        this.applicationBootstrapOrchestrator = new ApplicationBootstrapOrchestrator(
            this.clientRuntimeInstance
        );
    }
    
    /**
     * Execute complete application runtime initialization sequence
     * Implements error handling and graceful degradation patterns
     */
    async executeApplicationBootstrap() {
        try {
            await this.applicationBootstrapOrchestrator.executeDatabaseConnectionEstablishment();
            await this.applicationBootstrapOrchestrator.executeCommandDiscoveryAndRegistration();
            await this.applicationBootstrapOrchestrator.executeEventHandlerRegistration();
            await this.applicationBootstrapOrchestrator.executeMemoryOptimizationInitialization();
            await this.applicationBootstrapOrchestrator.executeAudioSubsystemInitialization();
            await this.applicationBootstrapOrchestrator.executeClientAuthenticationProcedure();
            
        } catch (applicationBootstrapException) {
            this.handleApplicationBootstrapFailure(applicationBootstrapException);
        }
    }
    
    /**
     * Handle application bootstrap failure with comprehensive error reporting
     */
    handleApplicationBootstrapFailure(exceptionInstance) {
        console.error('❌ Failed to initialize bot:', exceptionInstance);
        process.exit(1);
    }
}

/**
 * Application Bootstrap Orchestration Service
 * Manages complex initialization sequences with advanced error handling
 */
class ApplicationBootstrapOrchestrator {
    constructor(clientRuntimeInstance) {
        this.clientRuntimeInstance = clientRuntimeInstance;
        this.commandDiscoveryEngine = new CommandDiscoveryEngine();
        this.eventHandlerRegistrationService = new EventHandlerRegistrationService();
        this.audioSubsystemIntegrationManager = new AudioSubsystemIntegrationManager(clientRuntimeInstance);
    }
    
    /**
     * Execute database connection establishment with connection pooling
     */
    async executeDatabaseConnectionEstablishment() {
        await DatabaseConnectionEstablishmentService();
        console.log('✅ MongoDB connected successfully');
    }
    
    /**
     * Execute comprehensive command discovery and registration procedures
     */
    async executeCommandDiscoveryAndRegistration() {
        const commandRegistrationResults = await this.commandDiscoveryEngine
            .executeMessageCommandDiscovery(this.clientRuntimeInstance)
            .executeSlashCommandDiscovery(this.clientRuntimeInstance);
        
        console.log(`✅ Loaded ${commandRegistrationResults.totalCommands} commands`);
    }
    
    /**
     * Execute event handler registration with advanced event binding
     */
    async executeEventHandlerRegistration() {
        const eventRegistrationResults = await this.eventHandlerRegistrationService
            .executeEventDiscovery()
            .bindEventHandlers(this.clientRuntimeInstance);
        
        console.log(`✅ Loaded ${eventRegistrationResults.totalEvents} events`);
    }
    
    /**
     * Execute memory optimization subsystem initialization
     */
    async executeMemoryOptimizationInitialization() {
        MemoryGarbageCollectionOptimizer.init();
    }
    
    /**
     * Execute audio processing subsystem initialization with event binding
     */
    async executeAudioSubsystemInitialization() {
        this.clientRuntimeInstance.playerHandler.initializeEvents();
        //console.log('🎵 Player events initialized');
    }
    
    /**
     * Execute Discord client authentication and connectivity establishment
     */
    async executeClientAuthenticationProcedure() {
        const authenticationCredential = SystemConfigurationManager.discord.token || 
                                       process.env.TOKEN;
        
        await this.clientRuntimeInstance.login(authenticationCredential);
    }
}

/**
 * Command Discovery and Registration Engine
 * Implements advanced filesystem scanning and module resolution
 */
class CommandDiscoveryEngine {
    constructor() {
        this.discoveredMessageCommands = 0;
        this.discoveredSlashCommands = 0;
    }
    
    /**
     * Execute message command discovery with filesystem traversal
     */
    executeMessageCommandDiscovery(clientInstance) {
        const messageCommandDirectoryPath = SystemPathResolutionUtility.join(__dirname, 'commands', 'message');
        
        if (FileSystemOperationalInterface.existsSync(messageCommandDirectoryPath)) {
            const discoveredCommandFiles = FileSystemOperationalInterface
                .readdirSync(messageCommandDirectoryPath)
                .filter(fileEntity => fileEntity.endsWith('.js'));
            
            for (const commandFile of discoveredCommandFiles) {
                const commandModuleInstance = require(SystemPathResolutionUtility.join(messageCommandDirectoryPath, commandFile));
                clientInstance.commands.set(commandModuleInstance.name, commandModuleInstance);
                this.discoveredMessageCommands++;
            }
        }
        
        return this;
    }
    
    /**
     * Execute slash command discovery with advanced module resolution
     */
    executeSlashCommandDiscovery(clientInstance) {
        const slashCommandDirectoryPath = SystemPathResolutionUtility.join(__dirname, 'commands', 'slash');
        
        if (FileSystemOperationalInterface.existsSync(slashCommandDirectoryPath)) {
            const discoveredCommandFiles = FileSystemOperationalInterface
                .readdirSync(slashCommandDirectoryPath)
                .filter(fileEntity => fileEntity.endsWith('.js'));
            
            for (const commandFile of discoveredCommandFiles) {
                const commandModuleInstance = require(SystemPathResolutionUtility.join(slashCommandDirectoryPath, commandFile));
                clientInstance.slashCommands.set(commandModuleInstance.data.name, commandModuleInstance);
                this.discoveredSlashCommands++;
            }
        }
        
        return {
            totalCommands: this.discoveredMessageCommands + this.discoveredSlashCommands
        };
    }
}

/**
 * Event Handler Registration Service
 * Manages advanced event binding with lifecycle management
 */
class EventHandlerRegistrationService {
    constructor() {
        this.discoveredEventHandlers = [];
        this.boundEventHandlers = 0;
    }
    
    /**
     * Execute event handler discovery with filesystem traversal
     */
    executeEventDiscovery() {
        const eventHandlerDirectoryPath = SystemPathResolutionUtility.join(__dirname, 'events');
        const discoveredEventFiles = FileSystemOperationalInterface
            .readdirSync(eventHandlerDirectoryPath)
            .filter(fileEntity => fileEntity.endsWith('.js'));
        
        this.discoveredEventHandlers = discoveredEventFiles.map(eventFile => {
            return require(SystemPathResolutionUtility.join(eventHandlerDirectoryPath, eventFile));
        });
        
        return this;
    }
    
    /**
     * Bind discovered event handlers with advanced lifecycle management
     */
    bindEventHandlers(clientInstance) {
        for (const eventHandlerInstance of this.discoveredEventHandlers) {
            if (eventHandlerInstance.once) {
                clientInstance.once(eventHandlerInstance.name, (...eventArguments) => 
                    eventHandlerInstance.execute(...eventArguments, clientInstance));
            } else {
                clientInstance.on(eventHandlerInstance.name, (...eventArguments) => 
                    eventHandlerInstance.execute(...eventArguments, clientInstance));
            }
            this.boundEventHandlers++;
        }
        
        return {
            totalEvents: this.boundEventHandlers
        };
    }
}

/**
 * Audio Subsystem Integration Manager
 * Manages Riffy framework integration with advanced event handling
 */
class AudioSubsystemIntegrationManager {
    constructor(clientInstance) {
        this.clientRuntimeInstance = clientInstance;
        this.initializeAudioEventHandlers();
    }
    
    /**
     * Initialize comprehensive audio event handling subsystem
     */
    initializeAudioEventHandlers() {
        this.clientRuntimeInstance.on('raw', (gatewayEventPayload) => {
            this.processGatewayVoiceStateEvent(gatewayEventPayload);
        });
        
        this.bindRiffyEventHandlers();
    }
    
    /**
     * Process Discord gateway voice state events with validation
     */
    processGatewayVoiceStateEvent(eventPayload) {
        const validVoiceStateEvents = ['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'];
        
        if (!validVoiceStateEvents.includes(eventPayload.t)) return;
        
        this.clientRuntimeInstance.riffy.updateVoiceState(eventPayload);
    }
    
    /**
     * Bind Riffy framework event handlers with comprehensive logging
     */
    bindRiffyEventHandlers() {
        this.clientRuntimeInstance.riffy.on('nodeConnect', (audioNodeInstance) => {
            console.log(`🎵 Lavalink node "${audioNodeInstance.name}" connected`);
        });
        
        this.clientRuntimeInstance.riffy.on('nodeError', (audioNodeInstance, nodeErrorException) => {
            console.error(`🔴 Lavalink node "${audioNodeInstance.name}" error:`, nodeErrorException.message);
        });
    }
}


const enterpriseApplicationManager = new DiscordClientRuntimeManager();
enterpriseApplicationManager.executeApplicationBootstrap();


module.exports = enterpriseApplicationManager.clientRuntimeInstance;
shiva.initialize(enterpriseApplicationManager.clientRuntimeInstance);