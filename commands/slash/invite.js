const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    OAuth2Scopes,
    PermissionsBitField,
    SlashCommandBuilder
} = require('discord.js');
const shiva = require('../../shiva');
const config = require('../../config');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the invite link for the bot'),
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
            const permissions = [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.UseVAD
            ];

            let inviteUrl;
            try {
                inviteUrl = client.generateInvite({
                    scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
                    permissions
                });
            } catch (generateError) {
                const permissionBits = PermissionsBitField.resolve(permissions).toString();
                inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=${permissionBits}&scope=bot%20applications.commands`;
            }

            const supportServer = config?.bot?.supportServer;

            const embed = new EmbedBuilder()
                .setTitle('🔗 Invite Me')
                .setColor(0x1DB954)
                .setDescription(
                    `Add **${client.user.username}** to your own server and start the music!\n\n` +
                    `[Click here to invite me](${inviteUrl})` +
                    (supportServer ? `\n[Join the support server](${supportServer})` : '')
                )
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Invite')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteUrl)
            );

            if (supportServer) {
                buttons.addComponents(
                    new ButtonBuilder()
                        .setLabel('Support Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL(supportServer)
                );
            }

            return interaction.editReply({ embeds: [embed], components: [buttons] });
        } catch (error) {
            console.error('Invite command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while generating the invite link!');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};
