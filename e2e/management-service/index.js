const fs = require('fs');
const express = require('express');
const app = express();
const port = 8080;

app.get('/status', (req, res) => res.send(fs.readFileSync('./status1.json').toString()));

app.listen(port, () => console.log('Mock management-service started.'));