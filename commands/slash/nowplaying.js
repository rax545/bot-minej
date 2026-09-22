const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder
} = require('discord.js');
const shiva = require('../../shiva');
const PlayerHandler = require('../../utils/player');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show details for the currently playing song'),
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

        try {
            const player = client.riffy?.players?.get(interaction.guild.id);
            const track = player?.current;
            if (!player || !track?.info || (!player.playing && !player.paused)) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setDescription('❌ No music is currently playing!')]
                });
            }

            const info = track.info;
            const duration = Number(info.length) || 0;
            const position = Math.max(0, Number(player.position) || 0);
            const thumbnail = await new PlayerHandler(client).getThumbnailSafely(track);
            const requester = info.requester?.id
                ? `<@${info.requester.id}>`
                : info.requester?.username || 'Unknown';
            const loop = player.loop || 'none';
            const loopLabel = loop === 'track' ? '🔂 Track' : loop === 'queue' ? '🔁 Queue' : '➡️ Off';

            const embed = new EmbedBuilder()
                .setTitle(`🎵 ${info.title || 'Unknown Title'}`)
                .setColor(player.paused ? '#FFA500' : '#9966FF')
                .addFields(
                    { name: 'Artist', value: info.author || 'Unknown Artist', inline: true },
                    { name: 'Requester', value: requester, inline: true },
                    {
                        name: player.paused ? '⏸️ Paused' : '▶️ Progress',
                        value: `${createProgressBar(position, duration)}\n\`${formatDuration(position)} / ${formatDuration(duration)}\``,
                        inline: false
                    },
                    { name: '🔊 Volume', value: `${player.volume ?? 50}%`, inline: true },
                    { name: '🔁 Loop', value: loopLabel, inline: true },
                    { name: '📜 Queue', value: `${player.queue?.size || 0} song(s)`, inline: true }
                )
                .setTimestamp();

            if (thumbnail) embed.setThumbnail(thumbnail);

            const playbackButton = new ButtonBuilder()
                .setCustomId(player.paused ? 'music_resume' : 'music_pause')
                .setLabel(player.paused ? 'Resume' : 'Pause')
                .setStyle(player.paused ? ButtonStyle.Success : ButtonStyle.Primary)
                .setEmoji(player.paused ? '▶️' : '⏸️');

            const controls = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏭️'),
                playbackButton,
                new ButtonBuilder()
                    .setCustomId('music_loop')
                    .setLabel('Loop')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔁'),
                new ButtonBuilder()
                    .setCustomId('music_volume_down')
                    .setLabel('Volume −')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_volume_up')
                    .setLabel('Volume +')
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.editReply({ embeds: [embed], components: [controls] });
        } catch (error) {
            console.error('Now playing slash command error:', error);
            return interaction.editReply({
                embeds: [new EmbedBuilder().setDescription('❌ An error occurred while fetching current song!')]
            });
        }
    }
};

function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createProgressBar(position, duration) {
    const width = 18;
    const ratio = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
    const marker = Math.min(width - 1, Math.floor(ratio * (width - 1)));
    return `${'▬'.repeat(marker)}🔘${'▬'.repeat(width - marker - 1)}`;
}
