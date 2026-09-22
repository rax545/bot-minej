const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const shiva = require('../../shiva');
const ConditionChecker = require('../../utils/checks');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seek within the currently playing song')
        .addStringOption(option => option
            .setName('time')
            .setDescription('Position as mm:ss or seconds')
            .setRequired(true)),
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
            const checker = new ConditionChecker(client);
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );
            const conditionError = checker.getErrorMessage(conditions, 'seek');
            if (conditionError) return editAndDelete(interaction, conditionError);

            const player = conditions.player;
            if (!conditions.currentTrack || (!player.playing && !player.paused)) {
                return editAndDelete(interaction, '❌ No music is currently playing!');
            }

            const requestedTime = interaction.options.getString('time', true);
            const milliseconds = parseTime(requestedTime);
            if (milliseconds === null) {
                return editAndDelete(interaction, '❌ Use a valid time such as `1:30` or `90` seconds.');
            }

            const duration = Number(player.current?.info?.length) || 0;
            if (duration > 0 && milliseconds > duration) {
                return editAndDelete(interaction, `❌ That time is longer than the song (${formatDuration(duration)}).`);
            }

            await player.seek(milliseconds);
            const embed = new EmbedBuilder()
                .setDescription(`⏩ Seeked to **${formatDuration(milliseconds)}**`);
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        } catch (error) {
            console.error('Seek command error:', error);
            return editAndDelete(interaction, '❌ An error occurred while seeking in the song.');
        }
    }
};

function parseTime(value) {
    const input = String(value || '').trim();
    if (/^\d+(?:\.\d+)?$/.test(input)) {
        return Math.round(Number(input) * 1000);
    }

    if (!/^\d+(?::\d{1,2}){1,2}$/.test(input)) return null;
    const parts = input.split(':').map(Number);
    let seconds;
    if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
    } else {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return Number.isFinite(seconds) ? seconds * 1000 : null;
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function editAndDelete(interaction, message) {
    return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(message)] })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
}
