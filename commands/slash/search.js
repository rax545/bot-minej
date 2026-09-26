const {
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;
const MAX_RESULTS = 5;
const SELECT_TIMEOUT_MS = 60000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for a song and pick from the top 5 results')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or search query')
                .setRequired(true)
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
        const PlayerHandler = require('../../utils/player');
        const checker = new ConditionChecker(client);
        const playerHandler = new PlayerHandler(client);

        const query = interaction.options.getString('query');

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            const errorMsg = checker.getErrorMessage(conditions, 'play');
            if (errorMsg) {
                return editAndDelete(interaction, errorMsg);
            }

            if (!playerHandler.isLavalinkReady()) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setDescription(PlayerHandler.getLavalinkOfflineMessage())]
                });
            }

            const resolved = await client.riffy.resolve({ query, requester: interaction.user });
            const tracks = (resolved?.tracks || []).filter(track => track && track.info).slice(0, MAX_RESULTS);

            if (!tracks.length) {
                return editAndDelete(interaction, `❌ No results found for **${truncate(query, 80)}**!`, 5000);
            }

            const resultsList = tracks.map((track, index) =>
                `\`${index + 1}.\` **${truncate(track.info.title || 'Unknown Title', 60)}** — ${truncate(track.info.author || 'Unknown Artist', 30)} \`[${formatDuration(track.info.length)}]\``
            ).join('\n');

            const embed = new EmbedBuilder()
                .setTitle(`🔎 Search results for "${truncate(query, 60)}"`)
                .setColor('#9966FF')
                .setDescription(resultsList)
                .setFooter({ text: 'Pick a song from the menu below • expires in 60s' });

            const customId = `search_select_${interaction.id}`;
            const menu = new StringSelectMenuBuilder()
                .setCustomId(customId)
                .setPlaceholder('Select a song to play')
                .addOptions(tracks.map((track, index) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(truncate(track.info.title || 'Unknown Title', 90))
                        .setDescription(truncate(`${track.info.author || 'Unknown Artist'} • ${formatDuration(track.info.length)}`, 90))
                        .setValue(String(index))
                ));

            const row = new ActionRowBuilder().addComponents(menu);
            const message = await interaction.editReply({ embeds: [embed], components: [row] });

            let selection;
            try {
                selection = await message.awaitMessageComponent({
                    componentType: ComponentType.StringSelect,
                    time: SELECT_TIMEOUT_MS,
                    filter: componentInteraction =>
                        componentInteraction.customId === customId &&
                        componentInteraction.user.id === interaction.user.id
                });
            } catch (timeoutError) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setDescription('⌛ Search timed out - no song was selected.')],
                    components: []
                }).then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000)).catch(() => {});
            }

            await selection.deferUpdate().catch(() => {});

            const selectedTrack = tracks[Number(selection.values[0])];
            if (!selectedTrack || !selectedTrack.info) {
                return editAndDelete(interaction, '❌ That result is no longer available!', 3000, true);
            }

            const voiceChannelId = interaction.member.voice?.channelId;
            if (!voiceChannelId) {
                return editAndDelete(interaction, '❌ You need to be in a voice channel to play music!', 3000, true);
            }

            const player = await playerHandler.createPlayer(
                interaction.guild.id,
                voiceChannelId,
                interaction.channel.id
            );

            if (!player) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setDescription(PlayerHandler.getLavalinkOfflineMessage())],
                    components: []
                });
            }

            const voiceJoined = await playerHandler.waitForVoiceJoin(interaction.guild.id, voiceChannelId);
            if (!voiceJoined) {
                try { player.destroy(); } catch (destroyError) {}
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setDescription(PlayerHandler.getJoinFailedMessage())],
                    components: []
                });
            }

            selectedTrack.info.requester = interaction.user;
            player.queue.add(selectedTrack);

            if (!player.playing && !player.paused) {
                await player.play();
            }

            const addedEmbed = new EmbedBuilder()
                .setDescription(`✅ Added to queue: **${selectedTrack.info.title}**`);
            return interaction.editReply({ embeds: [addedEmbed], components: [] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 5000));

        } catch (error) {
            console.error('Search command error:', error);
            return editAndDelete(interaction, '❌ An error occurred while searching for music!', 3000, true);
        }
    }
};

function editAndDelete(interaction, message, delay = 3000, clearComponents = false) {
    const payload = { embeds: [new EmbedBuilder().setDescription(message)] };
    if (clearComponents) payload.components = [];
    return interaction.editReply(payload)
        .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), delay))
        .catch(() => {});
}

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
