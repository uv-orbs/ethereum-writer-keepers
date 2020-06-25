const fs = require('fs');
const express = require('express');
const app = express();
const port = 8080;

let mockState = 'init';

app.get('/status', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./status1.json'));

  data.Payload.CurrentRefTime = getCurrentClockTime() - 600;
  
  if (mockState == 'in-committee') {
    data.Payload.CurrentCommittee.push({
      EthAddress: '29ce860a2247d97160d6dfc087a15f41e2349087',
      Weight: 20000,
    });
  }
  
  res.send(JSON.stringify(data));
});

app.get('/change-mock-state/:state', (req, res) => {
  const { state } = req.params;
  mockState = state;
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => console.log('Mock management-service started.'));

// returns UTC clock time in seconds (similar to unix timestamp / Ethereum block time / RefTime)
function getCurrentClockTime() {
  return Math.round(new Date().getTime() / 1000);
}