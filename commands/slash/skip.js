const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),
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
        const votes = require('../../utils/votes');

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );
            const errorMsg = checker.getErrorMessage(conditions, 'skip');
            if (errorMsg) return editAndDelete(interaction, errorMsg);

            const player = conditions.player;
            const currentTrack = player.current;
            const currentTitle = currentTrack?.info?.title || 'Unknown';
            const trackId = currentTrack?.info?.identifier || currentTitle;
            const canSkipInstantly = await checker.canUseMusic(
                interaction.guild.id,
                interaction.user.id
            );
            const voiceChannel = interaction.guild.channels.cache.get(player.voiceChannel);
            const listenerCount = voiceChannel
                ? voiceChannel.members.filter(member => !member.user.bot).size
                : 1;

            if (canSkipInstantly || listenerCount <= 1) {
                votes.reset(interaction.guild.id, trackId);
                player.stop();
                return editAndDelete(interaction, `⏭️ Skipped: **${currentTitle}**`);
            }

            const needed = Math.floor(listenerCount / 2) + 1;
            const result = votes.cast(
                interaction.guild.id,
                trackId,
                interaction.user.id,
                needed
            );

            if (result.reached) {
                votes.reset(interaction.guild.id, trackId);
                player.stop();
                return editAndDelete(interaction, `⏭️ Vote passed. Skipped: **${currentTitle}**`);
            }

            return editAndDelete(
                interaction,
                `🗳️ Skip vote recorded: **${result.count}/${result.needed}** votes needed.`
            );
        } catch (error) {
            console.error('Skip command error:', error);
            return editAndDelete(interaction, '❌ An error occurred while skipping the song!');
        }
    }
};

function editAndDelete(interaction, message) {
    return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(message)] })
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
}
