const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'play',
    aliases: ['p', 'music', 'song', 'add'],
    description: 'Play a song or add to queue',
    securityToken: COMMAND_SECURITY_TOKEN,
    
    async execute(message, args, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;

        setTimeout(() => {
            message.delete().catch(() => {});
        }, 4000);
        
        const ConditionChecker = require('../../utils/checks');
        const PlayerHandler = require('../../utils/player');
        const ErrorHandler = require('../../utils/errorHandler');
        
        const query = args.join(' ');
        if (!query) {
            const embed = new EmbedBuilder().setDescription('❌ Please provide a song to play!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }

        try {
            const checker = new ConditionChecker(client);
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId,
                false
            );

            const errorMsg = checker.getErrorMessage(conditions, 'play');
            if (errorMsg) {
                const embed = new EmbedBuilder().setDescription(errorMsg);
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            let targetVC = message.member.voice.channelId;
            if (conditions.centralEnabled && conditions.botInCentralVC && conditions.centralVC) {
                targetVC = conditions.centralVC;
            }

            const playerHandler = new PlayerHandler(client);
            const player = await playerHandler.createPlayer(
                message.guild.id,
                targetVC,
                message.channel.id
            );

            const result = await playerHandler.playSong(player, query, message.author);

            if (result.type === 'track') {
                const embed = new EmbedBuilder().setDescription(`✅ Added to queue: **${result.track.info.title}**`);
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            } else if (result.type === 'playlist') {
                const embed = new EmbedBuilder().setDescription(`✅ Added **${result.tracks}** songs from playlist: **${result.name}**`);
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            } else {
                const embed = new EmbedBuilder().setDescription('❌ No results found for your query!');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

        } catch (error) {
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while trying to play music!');
            console.error('Play command error:', error);
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};
