const express = require('express');
const net = require('net');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(cors());

// Connect to the HyperDeck
const client = new net.Socket();
client.connect(9993, '10.123.33.17', () => {
  console.log('Connected to HyperDeck');
});

let responseData = '';

client.on('data', (data) => {
  responseData += data.toString();
});

client.on('close', () => {
  console.log('Connection closed');
});

// Helper function to send a command and retrieve the result
const sendCommand = (command) => {
  return new Promise((resolve, reject) => {
    responseData = ''; // Reset response buffer
    client.write(`${command}\n`, (err) => {
      if (err) {
        reject(err);
      } else {
        setTimeout(() => resolve(responseData), 500); // Delay to accumulate response
      }
    });
  });
};

// API to send control commands (play, pause, stop, next, previous)
app.post('/command', async (req, res) => {
  const { command } = req.body;
  try {
    const response = await sendCommand(command);
    res.send(response);
  } catch (error) {
    res.status(500).send('Error sending command');
  }
});

// API to fetch the current playlist
app.get('/playlist', async (req, res) => {
  try {
    const response = await sendCommand('clips get'); // Get current clips/playlist
    res.send(response);
  } catch (error) {
    res.status(500).send('Error fetching playlist');
  }
});

// app.get('/currentClip', async (req, res) => {
//     try {
//       const response = await sendCommand('transport info'); // Get current clips/playlist
//       res.send(response);
//     } catch (error) {
//       res.status(500).send('Error fetching current clip');
//     }
//   });


  // Fetch current clip info
app.get('/currentClip', async (req, res) => {
    try {
      const response = await sendCommand('transport info');
      const currentClip = parseCurrentClip(response);
      res.json(currentClip);
    } catch (err) {
      res.status(500).send('Error: ' + err);
    }
  });

// Function to parse current clip from response
const parseCurrentClip = (data) => {
  // Extract current clip information from the `transport info` response
  // This is a placeholder; adjust according to the actual response format
  
  const match = data.match(/clip id: (\d+)/);
  return match ? { id: match[1] } : {};
};

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
