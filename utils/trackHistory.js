/**
 * Track History Manager
 *
 * Keeps a small, in-memory list of the tracks that have been played in each
 * guild so commands like /back and /history can look at what came before the
 * song that is playing right now.
 *
 * The newest entry is always the LAST item of the array, so the currently
 * playing track sits at the end of the list.
 */

const MAX_HISTORY_PER_GUILD = 25;
const MAX_TRACKED_GUILDS = 500;

const guildHistories = new Map();

function getList(guildId) {
    if (!guildId) return null;
    if (!guildHistories.has(guildId)) {
        if (guildHistories.size >= MAX_TRACKED_GUILDS) {
            const oldestGuildId = guildHistories.keys().next().value;
            guildHistories.delete(oldestGuildId);
        }
        guildHistories.set(guildId, []);
    }
    return guildHistories.get(guildId);
}

/**
 * Store a track as the most recently started one for a guild.
 * Called from the `trackStart` event in utils/player.js.
 */
function push(guildId, track) {
    if (!guildId || !track || !track.info) return null;

    const list = getList(guildId);
    if (!list) return null;

    list.push(track);

    while (list.length > MAX_HISTORY_PER_GUILD) {
        list.shift();
    }

    return track;
}

/**
 * Tracks played in a guild, newest first (the currently playing song included).
 */
function getHistory(guildId) {
    const list = guildHistories.get(guildId);
    if (!list || !list.length) return [];
    return [...list].reverse();
}

/**
 * Tracks played BEFORE the current one, newest first.
 */
function getPreviousTracks(guildId) {
    return getHistory(guildId).slice(1);
}

/**
 * Peek at the track that was played right before the current one.
 */
function getPrevious(guildId) {
    const list = guildHistories.get(guildId);
    if (!list || list.length < 2) return null;
    return list[list.length - 2] || null;
}

/**
 * Remove the current entry plus the previous one and return the previous track.
 * Used by /back: the returned track is re-queued, and `trackStart` pushes it
 * back into the history when it actually starts playing again.
 */
function takePrevious(guildId) {
    const list = guildHistories.get(guildId);
    if (!list || list.length < 2) return null;

    list.pop();
    const previous = list.pop() || null;
    return previous;
}

function size(guildId) {
    return guildHistories.get(guildId)?.length || 0;
}

function clear(guildId) {
    if (!guildId) return false;
    return guildHistories.delete(guildId);
}

function clearAll() {
    guildHistories.clear();
}

module.exports = {
    MAX_HISTORY_PER_GUILD,
    push,
    getHistory,
    getPreviousTracks,
    getPrevious,
    takePrevious,
    size,
    clear,
    clearAll
};
