const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show bot and Lavalink health'),
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

        try {
            const { online, total } = getNodeStatus(client);
            const activePlayers = getCollectionSize(client.riffy?.players);
            const uptime = formatUptime(client.uptime || process.uptime() * 1000);
            const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);

            const embed = new EmbedBuilder()
                .setTitle('🩺 Bot Status')
                .setColor(online > 0 ? '#57F287' : '#ED4245')
                .addFields(
                    { name: 'Lavalink nodes', value: `${online}/${total} online`, inline: true },
                    { name: 'Active players', value: String(activePlayers), inline: true },
                    { name: 'Uptime', value: uptime, inline: true },
                    { name: 'Memory', value: `${memory} MB`, inline: true }
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Status command error:', error);
            return interaction.editReply({
                embeds: [new EmbedBuilder().setDescription('❌ Unable to read bot status right now.')]
            });
        }
    }
};

function getCollectionValues(collection) {
    if (!collection) return [];
    if (typeof collection.values === 'function') return [...collection.values()];
    if (Array.isArray(collection)) return collection;
    if (typeof collection === 'object') return Object.values(collection);
    return [];
}

function getCollectionSize(collection) {
    if (!collection) return 0;
    if (typeof collection.size === 'number') return collection.size;
    return getCollectionValues(collection).length;
}

function getNodeStatus(client) {
    const riffy = client.riffy;
    const configuredTotal = config.lavalink?.host
        ? 1
        : config.lavalink?.publicFallbackNodes?.length || 0;
    const nodes = getCollectionValues(riffy?.nodes);
    const total = nodes.length || configuredTotal;
    const connectedNodes = getCollectionValues(riffy?.leastUsedNodes);
    const online = connectedNodes.length > 0
        ? connectedNodes.length
        : nodes.filter(node => node.connected === true || node.ready === true || node.state === 'connected').length;

    return { online: Math.min(online, total || online), total: total || online };
}

function formatUptime(milliseconds) {
    let seconds = Math.floor((Number(milliseconds) || 0) / 1000);
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
