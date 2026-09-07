const Server = require('../models/Server');

class ConditionChecker {
    constructor(client) {
        this.client = client;
    }


    async checkMusicConditions(guildId, userId, voiceChannelId, fromCentral = false) {
        const player = this.client.riffy.players.get(guildId);
        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);
        const serverConfig = await Server.findById(guildId);


        const centralEnabled = serverConfig?.centralSetup?.enabled;
        const centralVC = serverConfig?.centralSetup?.vcChannelId;

        return {

            hasActivePlayer: !!player,
            isPlaying: player?.playing || false,
            isPaused: player?.paused || false,


            botVoiceChannel: player?.voiceChannel,
            userVoiceChannel: voiceChannelId,
            userInVoice: !!voiceChannelId,
            sameVoiceChannel: player?.voiceChannel === voiceChannelId,


            centralEnabled: centralEnabled,
            centralVC: centralVC,
            isCentralVC: centralVC === voiceChannelId,
            botInCentralVC: player?.voiceChannel === centralVC,
            fromCentral: fromCentral,


            canJoinVoice: member?.voice.channel ?
                member.voice.channel.permissionsFor(guild.members.me)?.has(['Connect', 'Speak']) : false,


            queueLength: player?.queue.size || 0,
            currentTrack: player?.current || null,


            player: player
        };
    }


    async canUseMusic(guildId, userId) {
        const serverConfig = await Server.findById(guildId);

        if (!serverConfig?.settings?.djRole) {
            return true;
        }

        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);

        return member?.roles.cache.has(serverConfig.settings.djRole) || false;
    }


    async canUseCentralSystem(guildId, userId) {
        const serverConfig = await Server.findById(guildId);

        if (!serverConfig?.centralSetup?.enabled) {
            return false;
        }

        if (!serverConfig.centralSetup.allowedRoles?.length) {
            return true;
        }

        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);

        return serverConfig.centralSetup.allowedRoles.some(roleId =>
            member?.roles.cache.has(roleId)
        );
    }


    getErrorMessage(conditions, action = 'play') {
        if (!conditions.userInVoice) {
            return '❌ You need to be in a voice channel to use music commands!';
        }

        if (!conditions.canJoinVoice) {
            return '❌ I don\'t have permission to join your voice channel!';
        }


        if (conditions.hasActivePlayer && !conditions.sameVoiceChannel) {

            if (conditions.botInCentralVC && !conditions.fromCentral) {
                if (conditions.centralEnabled && conditions.centralVC) {
                    return `❌ I'm currently in the central music system! Join <#${conditions.centralVC}> or use the central channel to control music.`;
                }
            }

            if (!conditions.botInCentralVC && conditions.fromCentral && conditions.centralVC) {
                return null;
            }

            return '❌ I\'m already playing music in a different voice channel!';
        }

        if (action === 'skip' && !conditions.isPlaying) {
            return '❌ Nothing is currently playing to skip!';
        }

        if (action === 'pause' && !conditions.isPlaying) {
            return '❌ Nothing is currently playing to pause!';
        }

        return null;
    }
}

module.exports = ConditionChecker;
