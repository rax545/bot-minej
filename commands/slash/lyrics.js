const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;
const LRCLIB_SEARCH_URL = 'https://lrclib.net/api/search';
const LRCLIB_USER_AGENT = 'bot-minej/1.0 (https://github.com/rax545/bot-minej)';
const LYRICS_CHAR_LIMIT = 3900;

function cleanTitle(title) {
    return String(title || '')
        .replace(/\(official\s*(music\s*)?video\)/gi, '')
        .replace(/\[official\s*(music\s*)?video\]/gi, '')
        .replace(/\(official\s*audio\)/gi, '')
        .replace(/\[official\s*audio\]/gi, '')
        .replace(/\(lyric(s)?\s*video\)/gi, '')
        .replace(/\[lyric(s)?\s*video\]/gi, '')
        .replace(/\(official\)/gi, '')
        .replace(/\[official\]/gi, '')
        .replace(/\(hd\)/gi, '')
        .replace(/\[hd\]/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

async function fetchLyrics({ title, artist }) {
    const params = new URLSearchParams();
    if (artist) {
        params.set('track_name', title);
        params.set('artist_name', artist);
    } else {
        params.set('q', title);
    }

    const response = await fetch(`${LRCLIB_SEARCH_URL}?${params.toString()}`, {
        headers: {
            'User-Agent': LRCLIB_USER_AGENT
        }
    });

    if (!response.ok) {
        throw new Error(`lrclib request failed with status ${response.status}`);
    }

    const results = await response.json();
    if (!Array.isArray(results)) return null;

    return results.find(result => result && typeof result.plainLyrics === 'string' && result.plainLyrics.trim().length > 0) || null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Fetch lyrics for a song')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song to search for (defaults to the currently playing track)')
                .setRequired(false)
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

        try {
            const query = interaction.options.getString('query');
            let title = null;
            let artist = null;

            if (query) {
                title = query.trim();
            } else {
                const player = client.riffy?.players?.get(interaction.guild.id);
                const info = player?.current?.info;

                if (!info?.title) {
                    const embed = new EmbedBuilder()
                        .setDescription('❌ Nothing is currently playing! Provide a `query` to search for lyrics.');
                    return interaction.editReply({ embeds: [embed] });
                }

                title = cleanTitle(info.title);
                artist = info.author ? cleanTitle(info.author) : null;
            }

            if (!title) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ Nothing is currently playing! Provide a `query` to search for lyrics.');
                return interaction.editReply({ embeds: [embed] });
            }

            const result = await fetchLyrics({ title, artist });

            if (!result) {
                const embed = new EmbedBuilder()
                    .setDescription(`❌ No lyrics found for **${title}${artist ? ` - ${artist}` : ''}**.`);
                return interaction.editReply({ embeds: [embed] });
            }

            let lyrics = result.plainLyrics.trim();
            if (lyrics.length > LYRICS_CHAR_LIMIT) {
                lyrics = `${lyrics.slice(0, LYRICS_CHAR_LIMIT)}...`;
            }

            const embedTitle = `📜 ${result.trackName || title}${result.artistName ? ` - ${result.artistName}` : ''}`;
            const embed = new EmbedBuilder()
                .setTitle(embedTitle.length > 256 ? embedTitle.slice(0, 253) + '...' : embedTitle)
                .setDescription(lyrics)
                .setColor('#9966FF');

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Lyrics command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while fetching lyrics!');
            return interaction.editReply({ embeds: [embed] });
        }
    }
};
