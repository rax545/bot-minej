const CentralEmbedHandler = require('./centralEmbed');

class PlayerHandler {
    constructor(client) {
        this.client = client;
        this.centralEmbed = new CentralEmbedHandler(client);
    }

    static getLavalinkOfflineMessage() {
        return '🔴 **Music server (Lavalink) is offline or unreachable!**\n' +
               'Music cannot play and I cannot join voice channels until it is connected.\n' +
               'Bot owner: set `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD` (and `LAVALINK_SECURE`) in `.env`, then restart the bot. See `.env.example`.';
    }

    isLavalinkReady() {
        return !!(this.client.riffy && this.client.riffy.initiated && this.client.riffy.leastUsedNodes.length > 0);
    }

    /**
     * Wait until the bot ACTUALLY appears in the voice channel (Discord confirmed).
     * Returns true on real join, false on timeout (e.g. missing Connect/Speak perms).
     */
    async waitForVoiceJoin(guildId, voiceChannelId, timeoutMs = 6000) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return false;
        const deadline = Date.now() + timeoutMs;

        const botInChannel = () => {
            const me = guild.members.me || guild.members.cache.get(this.client.user?.id);
            return me?.voice?.channelId === voiceChannelId;
        };

        while (Date.now() < deadline) {
            if (botInChannel()) return true;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return botInChannel();
    }

    static getJoinFailedMessage() {
        return '❌ I tried to join the voice channel but **Discord refused**.\n' +
               'Check my **Connect** & **Speak** permissions, make sure the channel is not private/locked for my role, and it is not full.';
    }

    async createPlayer(guildId, voiceChannelId, textChannelId, options = {}) {
        try {
            if (!this.isLavalinkReady()) {
                console.error('Player creation skipped: no Lavalink node is connected');
                return null;
            }

            let player = this.client.riffy.players.get(guildId);
            
            if (player) {
                if (player.voiceChannel === voiceChannelId) {
                    return player;
                } else {
                    await player.setVoiceChannel(voiceChannelId);
                    return player;
                }
            }

            player = this.client.riffy.createConnection({
                guildId: guildId,
                voiceChannel: voiceChannelId,
                textChannel: textChannelId,
                deaf: true,
                ...options
            });

            return player;
        } catch (error) {
            console.error('Player creation error:', error.message);
            return null;
        }
    }

    async playSong(player, query, requester) {
        try {
            if (!player) return { type: 'error', code: 'lavalink_offline', message: PlayerHandler.getLavalinkOfflineMessage() };

            const resolve = await this.client.riffy.resolve({ 
                query: query, 
                requester: requester 
            });

            const { loadType, tracks, playlistInfo } = resolve;

            if (loadType === 'playlist') {
                for (const track of tracks) {
                    if (track && track.info) {
                        track.info.requester = requester;
                        player.queue.add(track);
                    }
                }

                if (!player.playing && !player.paused) {
                    await player.play();
                }

                return {
                    type: 'playlist',
                    tracks: tracks.length,
                    name: playlistInfo?.name || 'Unknown Playlist'
                };

            } else if (loadType === 'search' || loadType === 'track') {
                const track = tracks[0];
                if (!track || !track.info) {
                    return { type: 'error', code: 'no_results', message: 'No results found' };
                }

                track.info.requester = requester;
                player.queue.add(track);

                if (!player.playing && !player.paused) {
                    await player.play();
                }

                return {
                    type: 'track',
                    track: track
                };

            } else {
                const failureMessage = resolve?.exception?.message
                    ? `Failed to load track: ${resolve.exception.message}`
                    : 'No results found';
                return { type: 'error', code: 'no_results', message: failureMessage };
            }

        } catch (error) {
            console.error('Play song error:', error.message);
            if (/no nodes are available/i.test(error.message || '')) {
                return { type: 'error', code: 'lavalink_offline', message: PlayerHandler.getLavalinkOfflineMessage() };
            }
            return { type: 'error', code: 'load_failed', message: `Failed to play song: ${error.message}` };
        }
    }


    async getThumbnailSafely(track) {
        try {
        
            if (track.info.thumbnail instanceof Promise) {
                const thumbnail = await Promise.race([
                    track.info.thumbnail,
                    new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
                ]);
                return typeof thumbnail === 'string' ? thumbnail : null;
            }
            
      
            if (typeof track.info.thumbnail === 'string' && track.info.thumbnail.trim() !== '') {
                return track.info.thumbnail;
            }
            
      
            if (track.info.identifier && track.info.sourceName === 'youtube') {
                return `https://img.youtube.com/vi/${track.info.identifier}/maxresdefault.jpg`;
            }
            
            return null;
        } catch (error) {
          
            if (track.info.identifier && track.info.sourceName === 'youtube') {
                return `https://img.youtube.com/vi/${track.info.identifier}/maxresdefault.jpg`;
            }
            return null;
        }
    }

    async getPlayerInfo(guildId) {
        try {
            const player = this.client.riffy.players.get(guildId);
            
            if (!player || !player.current || !player.current.info) {
                return null;
            }

      
            const thumbnail = await this.getThumbnailSafely(player.current);

            return {
                title: player.current.info.title || 'Unknown Title',
                author: player.current.info.author || 'Unknown Artist',
                duration: player.current.info.length || 0,
                thumbnail: thumbnail,
                requester: player.current.info.requester || null,
                playing: player.playing || false,
                paused: player.paused || false,
                position: player.position || 0,
                volume: player.volume || 50,
                loop: player.loop || 'none',
                queueLength: player.queue.size || 0
            };
        } catch (error) {
            console.error('Get player info error:', error.message);
            return null;
        }
    }

    initializeEvents() {
        this.client.riffy.on('trackStart', async (player, track) => {
            try {
                const trackTitle = track?.info?.title || 'Unknown Track';
                console.log(`🎵 Started playing: ${trackTitle} in ${player.guildId}`);
                
                if (this.client.statusManager) {
                    await this.client.statusManager.onTrackStart(player.guildId);
                }
                
                if (track && track.info) {
                    const thumbnail = await this.getThumbnailSafely(track);
                    
                    await this.centralEmbed.updateCentralEmbed(player.guildId, {
                        title: track.info.title || 'Unknown Title',
                        author: track.info.author || 'Unknown Artist',
                        duration: track.info.length || 0,
                        thumbnail: thumbnail,
                        requester: track.info.requester || null,
                        paused: player.paused || false,
                        volume: player.volume || 50,
                        loop: player.loop || 'none',
                        queueLength: player.queue.size || 0
                    });
                }
            } catch (error) {
                console.error('Track start error:', error.message);
            }
        });

        this.client.riffy.on('trackEnd', async (player, track) => {
            try {
                const trackTitle = track?.info?.title || 'Unknown Track';
                console.log(`🎵 Finished playing: ${trackTitle} in ${player.guildId}`);
                
                if (this.client.statusManager) {
                    await this.client.statusManager.onTrackEnd(player.guildId);
                }
            } catch (error) {
                console.error('Track end error (handled):', error.message);
            }
        });

        this.client.riffy.on('queueEnd', async (player) => {
            try {
                console.log(`🎵 Queue ended in ${player.guildId}`);
        
                await this.centralEmbed.updateCentralEmbed(player.guildId, null);
        
                const serverConfig = await require('../models/Server').findById(player.guildId);
        
                if (serverConfig?.settings?.autoplay) {
                    player.isAutoplay = true;
                }
        
                if (player.isAutoplay) {
                    player.autoplay(player);
                } else {
                    if (this.client.statusManager) {
                        await this.client.statusManager.onPlayerDisconnect(player.guildId);
                    }
                    player.destroy();
                }
            } catch (error) {
                console.error('Queue end error:', error.message);
                try {
                    player.destroy();
                } catch (destroyError) {
                    console.error('Player destroy error:', destroyError.message);
                }
            }
        });

        this.client.riffy.on('playerCreate', async (player) => {
            try {
                console.log(`🎵 Player created for guild ${player.guildId}`);
            } catch (error) {
                console.error('Player create error:', error.message);
            }
        });

        this.client.riffy.on('playerDisconnect', async (player) => {
            try {
                console.log(`🎵 Player destroyed for guild ${player.guildId}`);
                
                if (this.client.statusManager) {
                    await this.client.statusManager.onPlayerDisconnect(player.guildId);
                }
                
                await this.centralEmbed.updateCentralEmbed(player.guildId, null);
            } catch (error) {
                console.error('Player disconnect error:', error.message);
            }
        });

        this.client.riffy.on('nodeError', (node, error) => {
            console.error('🔴 Riffy Node Error:', error.message);
        });

        this.client.riffy.on('nodeDisconnect', (node) => {
            console.log('🟡 Riffy Node Disconnected:', node.name);
        });
    }
}

module.exports = PlayerHandler;
