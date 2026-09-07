const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'move',
    aliases: ['mv', 'movetrack'],
    description: 'Move a song to different position in queue',
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
        
        const from = parseInt(args[0]);
        const to = parseInt(args[1]);
        
        if (!from || !to || from < 1 || to < 1) {
            const embed = new EmbedBuilder().setDescription('❌ Please provide valid positions! Example: `!move 3 1` (move song 3 to position 1)');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || conditions.queueLength === 0) {
                const embed = new EmbedBuilder().setDescription('❌ Queue is empty!');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            if (from > conditions.queueLength || to > conditions.queueLength) {
                const embed = new EmbedBuilder().setDescription(`❌ Invalid positions! Queue has only ${conditions.queueLength} songs.`);
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            const player = conditions.player;
            const queueArray = Array.from(player.queue);

            const track = queueArray.splice(from - 1, 1)[0];
            queueArray.splice(to - 1, 0, track);

            player.queue.clear();
            queueArray.forEach(t => player.queue.add(t));

            const embed = new EmbedBuilder().setDescription(`🔄 Moved **${track.info.title}** from position ${from} to ${to}!`);
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));

        } catch (error) {
            console.error('Move command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while moving the song!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};
