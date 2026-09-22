const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const shiva = require('../../shiva');
const ConditionChecker = require('../../utils/checks');
const Server = require('../../models/Server');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('247')
        .setDescription('Toggle 24/7 mode for this server'),
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
            const canUseMusic = await checker.canUseMusic(interaction.guild.id, interaction.user.id);
            if (!canUseMusic) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setDescription('❌ You need DJ permissions to use 24/7 mode.')]
                });
            }

            let server = await Server.findById(interaction.guild.id);
            if (!server) {
                server = new Server({ _id: interaction.guild.id, settings: {} });
            }
            if (!server.settings) server.settings = {};

            server.settings.twentyFourSeven = !Boolean(server.settings.twentyFourSeven);
            await server.save();

            const enabled = server.settings.twentyFourSeven;
            const description = enabled
                ? '✅ 24/7 mode enabled. I will stay connected when the queue is empty.'
                : '✅ 24/7 mode disabled. I can leave when the queue is empty.';
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(description)] });
        } catch (error) {
            console.error('247 command error:', error);
            return interaction.editReply({
                embeds: [new EmbedBuilder().setDescription('❌ Unable to update 24/7 mode right now.')]
            });
        }
    }
};
