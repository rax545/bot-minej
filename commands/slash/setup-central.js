const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const Server = require('../../models/Server');
const CentralEmbedHandler = require('../../utils/centralEmbed');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-central')
        .setDescription('Setup the central music system in current channel')
        .addChannelOption(option =>
            option.setName('voice-channel')
                .setDescription('Voice channel for music (optional)')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('allowed-role')
                .setDescription('Role allowed to use central system (optional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
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

        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;
        const channelId = interaction.channel.id;
        const voiceChannel = interaction.options.getChannel('voice-channel');
        const allowedRole = interaction.options.getRole('allowed-role');

        try {
            let serverConfig = await Server.findById(guildId);
            
            if (serverConfig?.centralSetup?.enabled) {
                return interaction.editReply({
                    content: '❌ Central music system is already setup! Use `/disable-central` first to reset.',
                    ephemeral: true
                });
            }

            const botMember = interaction.guild.members.me;
            const channel = interaction.channel;
            
            if (!channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks', 'ManageMessages'])) {
                return interaction.editReply({
                    content: '❌ I need `Send Messages`, `Embed Links`, and `Manage Messages` permissions in this channel!',
                    ephemeral: true
                });
            }

            const centralHandler = new CentralEmbedHandler(client);
            const embedMessage = await centralHandler.createCentralEmbed(channelId, guildId);
            
            if (!embedMessage) {
                return interaction.editReply({
                    content: '❌ Failed to create central embed!',
                    ephemeral: true
                });
            }

            const setupData = {
                _id: guildId,
                centralSetup: {
                    enabled: true,
                    channelId: channelId,
                    embedId: embedMessage.id,
                    vcChannelId: voiceChannel?.id || null,
                    allowedRoles: allowedRole ? [allowedRole.id] : [],
                    deleteMessages: true
                }
            };

            await Server.findByIdAndUpdate(guildId, setupData, { 
                upsert: true, 
                new: true 
            });

            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Central Music System Setup Complete!')
                .setDescription(`Central music control has been setup in <#${channelId}>`)
                .addFields(
                    { name: '📍 Channel', value: `<#${channelId}>`, inline: true },
                    { name: '🔊 Voice Channel', value: voiceChannel ? `<#${voiceChannel.id}>` : 'Not set', inline: true },
                    { name: '👥 Allowed Role', value: allowedRole ? `<@&${allowedRole.id}>` : 'Everyone', inline: true }
                )
                .setColor(0x00FF00)
                .setFooter({ text: 'Users can now type song names in the channel to play music!' });

            await interaction.editReply({ embeds: [successEmbed] });

            setTimeout(async () => {
                try {
                    const usageEmbed = new EmbedBuilder()
                        .setTitle('🎵 Central Music System Active!')
                        .setDescription(
                            '• Type any **song name** to play music\n' +
                            '• Links (YouTube, Spotify) are supported\n' +
                            '• Other messages will be auto-deleted\n' +
                            '• Use normal commands (`!play`, `/play`) in other channels\n\n' +
                            '⚠️ This message will be automatically deleted in 10 seconds!'
                        )
                        .setColor(0x1DB954)
                        .setFooter({ text: 'Enjoy your music!' });
            
                    const msg = await channel.send({ embeds: [usageEmbed] });
            
                    // Delete after 10 seconds
                    setTimeout(() => {
                        msg.delete().catch(() => {});
                    }, 10000);
            
                } catch (error) {
                    console.error('Error sending usage instructions:', error);
                }
            }, 2000);
            

        } catch (error) {
            console.error('Error setting up central system:', error);
            
            await interaction.editReply({
                content: '❌ An error occurred while setting up the central music system!',
                ephemeral: true
            });
        }
    }
};
