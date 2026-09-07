const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class EmbedUtils {
    static createSuccessEmbed(title, description) {
        return new EmbedBuilder()
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setColor(0x00FF00)
            .setTimestamp();
    }
    
    static createErrorEmbed(title, description) {
        return new EmbedBuilder()
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setColor(0xFF0000)
            .setTimestamp();
    }
    
    static createMusicEmbed(title, description) {
        return new EmbedBuilder()
            .setTitle(`🎵 ${title}`)
            .setDescription(description)
            .setColor(config.bot.embedColor)
            .setTimestamp();
    }
}

module.exports = EmbedUtils;
