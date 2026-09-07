require('./main');
require('./shiva'); 
const path = require('path');
const express = require("express");
const app = express();
const port = 8888;
app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath);
});
app.listen(port, () => {
    console.log(`🔗 Listening to GlaceYT : http://localhost:${port}`);
});
