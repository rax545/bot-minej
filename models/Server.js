const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    _id: String, 
    

    centralSetup: {
        enabled: Boolean,
        channelId: String,
        embedId: String, 
        vcChannelId: String,
        allowedRoles: [String]
    },
    

    autoVcSetup: {
        enabled: Boolean,
        categoryId: String,
        namingPattern: String,
        autoDelete: Boolean
    },
    

    settings: {
        prefix: String,
        autoplay: Boolean,
        defaultVolume: Number,
        djRole: String
    }
});

module.exports = mongoose.model('Server', serverSchema);
