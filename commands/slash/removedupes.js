const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removedupes')
        .setDescription('Remove duplicate songs from the queue'),
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || conditions.queueLength === 0) {
                const embed = new EmbedBuilder().setDescription('❌ Queue is empty!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder().setDescription('❌ You need to be in the same voice channel as the bot!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            const player = conditions.player;
            const originalLength = player.queue.size;

            const seen = new Set();
            const uniqueTracks = [];

            for (const track of Array.from(player.queue)) {
                const key = getTrackKey(track);
                if (seen.has(key)) continue;
                seen.add(key);
                uniqueTracks.push(track);
            }

            const removedCount = originalLength - uniqueTracks.length;

            if (removedCount === 0) {
                const embed = new EmbedBuilder().setDescription('✅ No duplicate songs found in the queue!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            player.queue.clear();
            for (const track of uniqueTracks) {
                player.queue.add(track);
            }

            const embed = new EmbedBuilder()
                .setDescription(`🧹 Removed **${removedCount}** duplicate song(s)! Queue now has **${player.queue.size}** song(s).`);
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));

        } catch (error) {
            console.error('Removedupes command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while removing duplicates!');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};

function getTrackKey(track) {
    const info = track?.info || {};
    if (info.identifier) return `id:${info.identifier}`;
    if (info.uri) return `uri:${info.uri}`;
    return `meta:${String(info.title || '').toLowerCase()}|${String(info.author || '').toLowerCase()}`;
}
