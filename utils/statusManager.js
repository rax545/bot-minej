const { ActivityType } = require('discord.js');
const config = require('../config');

class StatusManager {
    constructor(client) {
        this.client = client;
        this.currentInterval = null;
        this.isPlaying = false;
        this.voiceChannelData = new Map(); 
    }


    async updateStatusAndVoice(guildId) {
        try {
    
            const playerInfo = await this.client.playerHandler.getPlayerInfo(guildId);

            if (playerInfo && (playerInfo.playing || playerInfo.paused)) {
         
                await this.setPlayingStatus(playerInfo.title);
                await this.setVoiceChannelStatus(guildId, playerInfo.title);
            } else {
           
                await this.setDefaultStatus();
                await this.clearVoiceChannelStatus(guildId);
            }
        } catch (error) {
            console.error('❌ Error updating status and voice channel:', error);
        }
    }


    async setPlayingStatus(trackTitle) {
        this.stopCurrentStatus();
        this.isPlaying = true;

        const activity = `🎵 ${trackTitle}`;
        await this.client.user.setPresence({
            activities: [{
                name: activity,
                type: ActivityType.Listening
            }],
            status: 'online'
        });

        // A playing track owns the presence. The idle RPC timer stays paused until
        // setDefaultStatus/setServerCountStatus is called when playback stops.
        console.log(`✅ Status locked to: ${activity}`);
    }


    async setVoiceChannelStatus(guildId, trackTitle) {
        try {
            const player = this.client.riffy.players.get(guildId);
            if (!player || !player.voiceChannel) return;

            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            const voiceChannel = guild.channels.cache.get(player.voiceChannel);
            if (!voiceChannel) return;

        
            if (!this.voiceChannelData.has(voiceChannel.id)) {
                this.voiceChannelData.set(voiceChannel.id, {
                    originalName: voiceChannel.name,
                    originalTopic: voiceChannel.topic
                });
            }

    
            const botMember = guild.members.me;
            const permissions = voiceChannel.permissionsFor(botMember);
            
            if (!permissions?.has('ManageChannels')) {
                console.warn(`⚠️ Bot lacks 'Manage Channels' permission in ${voiceChannel.name}`);
                return;
            }

            const statusText = `🎵 ${trackTitle}`;

        
            let success = await this.createVoiceStatusAPI(voiceChannel.id, statusText);
            if (success) return;

            success = await this.createChannelTopic(voiceChannel, trackTitle);
            if (success) return;

            await this.createChannelName(voiceChannel, trackTitle);

        } catch (error) {
            console.error(`❌ Voice channel status creation failed: ${error.message}`);
        }
    }


    async clearVoiceChannelStatus(guildId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

       
            const botMember = guild.members.me;
            let voiceChannel = null;

    
            const player = this.client.riffy.players.get(guildId);
            if (player && player.voiceChannel) {
                voiceChannel = guild.channels.cache.get(player.voiceChannel);
            }

   
            if (!voiceChannel && botMember.voice.channelId) {
                voiceChannel = guild.channels.cache.get(botMember.voice.channelId);
            }

 
            if (!voiceChannel) {
                for (const channel of guild.channels.cache.values()) {
                    if (channel.type === 2 && this.voiceChannelData.has(channel.id)) { // Voice channel
                        voiceChannel = channel;
                        break;
                    }
                }
            }

            if (!voiceChannel) return;

    
            const permissions = voiceChannel.permissionsFor(botMember);
            if (!permissions?.has('ManageChannels')) {
                console.warn(`⚠️ Bot lacks 'Manage Channels' permission in ${voiceChannel.name}`);
                return;
            }

        
            let success = await this.deleteVoiceStatusAPI(voiceChannel.id);
            if (success) return;

            success = await this.deleteChannelTopic(voiceChannel);
            if (success) return;

            await this.deleteChannelName(voiceChannel);

        } catch (error) {
            console.error(`❌ Voice channel status clearing failed: ${error.message}`);
        }
    }

   
    async createVoiceStatusAPI(channelId, statusText) {
        try {
            await this.client.rest.put(`/channels/${channelId}/voice-status`, {
                body: { status: statusText }
            });
            console.log(`✅ Voice status created: ${statusText}`);
            return true;
        } catch (error) {
            console.log(`ℹ️ Voice status API not available for creation`);
            return false;
        }
    }


    async deleteVoiceStatusAPI(channelId) {
        try {
            
            await this.client.rest.put(`/channels/${channelId}/voice-status`, {
                body: { status: null }
            });
            console.log(`✅ Voice status cleared`);
            return true;
        } catch (error) {
            try {
             
                await this.client.rest.delete(`/channels/${channelId}/voice-status`);
                console.log(`✅ Voice status deleted`);
                return true;
            } catch (deleteError) {
                console.log(`ℹ️ Voice status API not available for deletion`);
                return false;
            }
        }
    }


    async createChannelTopic(voiceChannel, trackTitle) {
        try {
            const topicText = `🎵 Now Playing: ${trackTitle}`;
            await voiceChannel.setTopic(topicText);
            console.log(`✅ Voice channel topic created: ${topicText}`);
            return true;
        } catch (error) {
            console.log(`ℹ️ Channel topic creation failed: ${error.message}`);
            return false;
        }
    }


    async deleteChannelTopic(voiceChannel) {
        try {
            const originalData = this.voiceChannelData.get(voiceChannel.id);
            const originalTopic = originalData?.originalTopic || null;
            
            await voiceChannel.setTopic(originalTopic);
            console.log(`✅ Voice channel topic restored`);
            return true;
        } catch (error) {
            console.log(`ℹ️ Channel topic restoration failed: ${error.message}`);
            return false;
        }
    }


    async createChannelName(voiceChannel, trackTitle) {
        try {
            const originalData = this.voiceChannelData.get(voiceChannel.id);
            const baseName = originalData?.originalName || voiceChannel.name.replace(/🎵.*$/, '').trim();
            
            const shortTitle = trackTitle.length > 15 
                ? trackTitle.substring(0, 15) + '...' 
                : trackTitle;
            const newName = `🎵 ${baseName}`;

            if (newName !== voiceChannel.name && newName.length <= 100) {
                await voiceChannel.setName(newName);
                console.log(`✅ Voice channel name created: ${newName}`);
            }
            return true;
        } catch (error) {
            console.warn(`⚠️ Channel name creation failed: ${error.message}`);
            return false;
        }
    }

   
    async deleteChannelName(voiceChannel) {
        try {
            const originalData = this.voiceChannelData.get(voiceChannel.id);
            const originalName = originalData?.originalName;
            
            if (originalName && originalName !== voiceChannel.name) {
                await voiceChannel.setName(originalName);
                console.log(`✅ Voice channel name restored: ${originalName}`);
                
         
                this.voiceChannelData.delete(voiceChannel.id);
            }
            return true;
        } catch (error) {
            console.warn(`⚠️ Channel name restoration failed: ${error.message}`);
            return false;
        }
    }


    getRpcStatuses() {
        const configuredStatuses = Array.isArray(config.rpc?.statuses)
            ? config.rpc.statuses.filter(status => typeof status === 'string' && status.trim())
            : [];
        return configuredStatuses.length > 0 ? configuredStatuses : ['🎵 Developed by JOy'];
    }

    getRpcInterval() {
        const configuredInterval = Number(config.rpc?.intervalMs);
        return Math.max(5000, Number.isFinite(configuredInterval) && configuredInterval > 0
            ? configuredInterval
            : 20000);
    }

    formatRpcStatus(status) {
        return status.replace(/\{servers\}/g, String(this.client.guilds.cache.size));
    }

    async setRpcPresence(statusName) {
        const name = this.formatRpcStatus(statusName);
        await this.client.user.setPresence({
            activities: [{ name, type: ActivityType.Watching }],
            status: 'online'
        });
        console.log(`🪪 RPC set: ${name}`);
    }

    async setDefaultStatus() {
        this.isPlaying = false;
        await this.setServerCountStatus(this.client.guilds.cache.size);
    }

    stopCurrentStatus() {
        if (this.currentInterval) {
            clearInterval(this.currentInterval);
            this.currentInterval = null;
        }
    }

    async setServerCountStatus(serverCount = this.client.guilds.cache.size) {
        if (this.isPlaying) return;

        this.stopCurrentStatus();
        const statuses = this.getRpcStatuses();
        let statusIndex = 0;
        const setNextStatus = async () => {
            if (this.isPlaying) return;
            const statusName = statuses[statusIndex % statuses.length];
            statusIndex++;
            try {
                await this.setRpcPresence(statusName);
            } catch (error) {
                console.error(`❌ RPC update failed: ${error.message}`);
            }
        };

        // Keep the argument for compatibility with existing callers, but always
        // resolve {servers} from the live guild cache.
        void serverCount;
        await setNextStatus();
        this.currentInterval = setInterval(setNextStatus, this.getRpcInterval());
    }


    async onTrackStart(guildId) {
        await this.updateStatusAndVoice(guildId);
    }

 
    async onTrackEnd(guildId) {
        setTimeout(async () => {
            await this.updateStatusAndVoice(guildId);
        }, 1000);
    }


    async onPlayerDisconnect(guildId = null) {
        await this.setDefaultStatus();
        
        if (guildId) {
       
            await this.clearVoiceChannelStatus(guildId);
        } else {
     
            for (const guild of this.client.guilds.cache.values()) {
                await this.clearVoiceChannelStatus(guild.id);
            }
        }
    }


    async testVoiceChannelCRUD(guildId, testText = 'Test Song') {
        console.log(`🧪 Testing Voice Channel CRUD for guild ${guildId}`);
        
        const results = [];
        
   
        await this.setVoiceChannelStatus(guildId, testText);
        results.push('✅ CREATE: Status set');
        
        await new Promise(resolve => setTimeout(resolve, 3000)); 
        
     
        const player = this.client.riffy.players.get(guildId);
        if (player?.voiceChannel) {
            const guild = this.client.guilds.cache.get(guildId);
            const voiceChannel = guild?.channels.cache.get(player.voiceChannel);
            if (voiceChannel) {
                results.push(`📖 READ: Channel name: ${voiceChannel.name}`);
                results.push(`📖 READ: Channel topic: ${voiceChannel.topic || 'None'}`);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        
  
        await this.clearVoiceChannelStatus(guildId);
        results.push('🗑️ DELETE: Status cleared');
        
        return results.join('\n');
    }
}

module.exports = StatusManager;
