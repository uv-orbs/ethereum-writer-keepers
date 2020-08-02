const fs = require('fs');
const express = require('express');
const app = express();
const port = 8080;

let mockState = 'init';

app.get('/metrics', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./metrics1.json'));

  if (mockState == 'synced') {
    data.BlockStorage.InOrderBlock.BlockTime.Value = getCurrentClockTime() * 1e9;
  }
  
  res.send(JSON.stringify(data));
});

app.get('/change-mock-state/:state', (req, res) => {
  const { state } = req.params;
  mockState = state;
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => console.log('Mock vchain started.'));

// returns UTC clock time in seconds (similar to unix timestamp / Ethereum block time / RefTime)
function getCurrentClockTime() {
  return Math.round(new Date().getTime() / 1000);
}