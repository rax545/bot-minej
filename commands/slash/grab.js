const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grab')
        .setDescription('Send the currently playing song to your DMs'),
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
        const PlayerHandler = require('../../utils/player');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || !conditions.currentTrack) {
                const embed = new EmbedBuilder().setDescription('❌ No music is currently playing!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            const player = conditions.player;
            const track = player.current;
            const info = track.info || {};
            const duration = Number(info.length) || 0;
            const position = Math.max(0, Number(player.position) || 0);
            const thumbnail = await new PlayerHandler(client).getThumbnailSafely(track);
            const requester = info.requester?.username || info.requester?.tag || 'Unknown';

            const dmEmbed = new EmbedBuilder()
                .setTitle(`🎵 ${info.title || 'Unknown Title'}`)
                .setColor('#1DB954')
                .addFields(
                    { name: 'Artist', value: info.author || 'Unknown Artist', inline: true },
                    { name: 'Duration', value: duration > 0 ? formatDuration(duration) : 'LIVE', inline: true },
                    { name: 'Grabbed at', value: formatDuration(position), inline: true },
                    { name: 'Source', value: info.sourceName || 'Unknown', inline: true },
                    { name: 'Requested by', value: requester, inline: true },
                    { name: 'Server', value: interaction.guild.name, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Grabbed with /grab' });

            if (info.uri) dmEmbed.setURL(info.uri).addFields({ name: 'Link', value: info.uri, inline: false });
            if (thumbnail) dmEmbed.setThumbnail(thumbnail);

            try {
                await interaction.user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ I could not DM you! Please enable direct messages from server members.');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));
            }

            const embed = new EmbedBuilder()
                .setDescription(`📬 Sent **${info.title || 'the current song'}** to your DMs!`);
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));

        } catch (error) {
            console.error('Grab command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while grabbing the current song!');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};

function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
