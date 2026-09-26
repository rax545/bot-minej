const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply an audio filter/preset to the music')
        .addStringOption(option =>
            option.setName('preset')
                .setDescription('Filter preset to apply')
                .setRequired(true)
                .addChoices(
                    { name: 'Bass Boost', value: 'bass' },
                    { name: 'Bass Boost+', value: 'bassplus' },
                    { name: 'Nightcore', value: 'nightcore' },
                    { name: 'Vaporwave', value: 'vaporwave' },
                    { name: '8D', value: '8d' },
                    { name: 'Karaoke', value: 'karaoke' },
                    { name: 'Slowmode', value: 'slow' },
                    { name: 'Treble', value: 'treble' },
                    { name: 'Reset', value: 'reset' }
                )
        ),
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

            if (!conditions.hasActivePlayer) {
                const embed = new EmbedBuilder().setDescription('❌ No music is currently playing!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 4000));
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder().setDescription('❌ You need to be in the same voice channel as the bot!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 4000));
            }

            if (!conditions.isPlaying) {
                const embed = new EmbedBuilder().setDescription('❌ No music is currently playing!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 4000));
            }

            const preset = interaction.options.getString('preset', true);
            const player = conditions.player;

            if (!player.filters) {
                const embed = new EmbedBuilder().setDescription('❌ Filters are not supported on this player!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 4000));
            }

            let successMessage;

            if (preset === 'reset') {
                player.filters.clearFilters();
                successMessage = '🎚️ Filters have been reset to default.';
            } else {
                player.filters.clearFilters();

                switch (preset) {
                    case 'bass':
                        player.filters.setBassboost(true, { value: 3 });
                        successMessage = '🎚️ Applied **Bass Boost** filter.';
                        break;
                    case 'bassplus':
                        player.filters.setBassboost(true, { value: 5 });
                        successMessage = '🎚️ Applied **Bass Boost+** filter.';
                        break;
                    case 'nightcore':
                        player.filters.setNightcore(true, { rate: 1.3 });
                        successMessage = '🎚️ Applied **Nightcore** filter.';
                        break;
                    case 'vaporwave':
                        player.filters.setVaporwave(true, { pitch: 0.5 });
                        successMessage = '🎚️ Applied **Vaporwave** filter.';
                        break;
                    case '8d':
                        player.filters.set8D(true, { rotationHz: 0.2 });
                        successMessage = '🎚️ Applied **8D** filter.';
                        break;
                    case 'karaoke':
                        player.filters.setKaraoke(true);
                        successMessage = '🎚️ Applied **Karaoke** filter.';
                        break;
                    case 'slow':
                        player.filters.setSlowmode(true, { rate: 0.8 });
                        successMessage = '🎚️ Applied **Slowmode** filter.';
                        break;
                    case 'treble':
                        player.filters.setTimescale(true, { speed: 1, pitch: 1.2, rate: 1 });
                        successMessage = '🎚️ Applied **Treble** filter.';
                        break;
                    default: {
                        const embed = new EmbedBuilder().setDescription('❌ Unknown filter preset!');
                        return interaction.editReply({ embeds: [embed] })
                            .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 4000));
                    }
                }
            }

            const embed = new EmbedBuilder().setDescription(successMessage);
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 4000));

        } catch (error) {
            console.error('Filter command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while applying the filter!');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 4000));
        }
    }
};
