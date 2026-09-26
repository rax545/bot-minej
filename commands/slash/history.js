const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;
const MAX_SHOWN = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('Show the recently played songs in this server'),
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
        const trackHistory = require('../../utils/trackHistory');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            const playedTracks = trackHistory.getPreviousTracks(interaction.guild.id);

            if (!playedTracks.length) {
                const embed = new EmbedBuilder().setDescription('📭 No songs have been played yet in this session!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
            }

            const list = playedTracks.slice(0, MAX_SHOWN).map((track, index) => {
                const info = track?.info || {};
                const title = truncate(info.title || 'Unknown Title', 55);
                const line = info.uri ? `[${title}](${info.uri})` : `**${title}**`;
                return `\`${index + 1}.\` ${line} — ${truncate(info.author || 'Unknown Artist', 25)} \`[${formatDuration(info.length)}]\``;
            }).join('\n');

            const remaining = playedTracks.length - Math.min(playedTracks.length, MAX_SHOWN);
            const nowPlaying = conditions.currentTrack?.info?.title;

            const embed = new EmbedBuilder()
                .setTitle('🕒 Recently Played')
                .setColor('#9966FF')
                .setDescription(`${list}${remaining > 0 ? `\n… and ${remaining} more` : ''}`)
                .setFooter({ text: 'Newest first • use /back to replay the previous song' })
                .setTimestamp();

            if (nowPlaying) {
                embed.addFields({ name: '▶️ Now Playing', value: truncate(nowPlaying, 90), inline: false });
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('History command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while fetching the track history!');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};

function truncate(value, length) {
    const text = String(value ?? '');
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
    if (!totalSeconds) return 'LIVE';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
