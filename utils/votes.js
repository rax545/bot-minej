const votesByGuildAndTrack = new Map();

function getVoteKey(guildId, trackId) {
    return `${guildId}:${trackId}`;
}

function reset(guildId, trackId) {
    if (trackId === undefined) {
        for (const key of votesByGuildAndTrack.keys()) {
            if (key.startsWith(`${guildId}:`)) {
                votesByGuildAndTrack.delete(key);
            }
        }
        return;
    }

    votesByGuildAndTrack.delete(getVoteKey(guildId, trackId));
}

function cast(guildId, trackId, userId, needed) {
    const key = getVoteKey(guildId, trackId);
    let voters = votesByGuildAndTrack.get(key);
    if (!voters) {
        voters = new Set();
        votesByGuildAndTrack.set(key, voters);
    }

    voters.add(userId);
    const requiredVotes = Math.max(1, Number(needed) || 1);
    const count = voters.size;

    return {
        count,
        needed: requiredVotes,
        reached: count >= requiredVotes
    };
}

module.exports = { reset, cast };
