import React, { useState, useEffect } from 'react';

function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentClipIndex, setCurrentClipIndex] = useState(null); // Track the current clip index
  const [response, setResponse] = useState('');

  // Fetch the current playlist
  const fetchPlaylist = () => {
    fetch('http://localhost:4000/playlist')
      .then((res) => res.text()) // Update to res.text() to handle plain text response
      .then((data) => {
        const playlistArray = parsePlaylist(data);
        console.log('playlistArray:', playlistArray);
        setPlaylist(playlistArray);
        if (playlistArray.length > 0) {
            fetchCurrentClip();
        //   setCurrentClipIndex(0); // Start at the first clip
        }
      })
      .catch((err) => console.error('Error fetching playlist:', err));
  };

  // Fetch the current playing clip
//   const fetchCurrentClip = () => {
//     fetch('http://localhost:4000/currentClip')
//       .then((res) => {
//         console.log('Current Clip Response:', res); // Log response object
//         return res.json();
//       })
//       .then((data) => {
//         console.log('Parsed Current Clip Data:', data.id); // Log parsed data
//         setCurrentClipIndex(
//           playlist.findIndex(clip => clip.id === data.id)
//         );
//       })
//       .catch((err) => console.error('Error fetching current clip:', err));
//   };

  // Fetch the current playing clip
  const fetchCurrentClip = () => {
    fetch('http://localhost:4000/currentClip')
      .then((res) => res.json())
      .then((data) => {
        console.log('Current Clip Response:', data); // Log raw response
        const currentClipId = data.id; // Extract ID from JSON response
        console.log('currentClipId', currentClipId);

        setCurrentClipIndex(
          playlist.findIndex(clip => clip.id === currentClipId)
        );
        console.log('currentClipIndex', playlist.findIndex(clip => clip.id == currentClipId));
        // setCurrentClipIndex(
        //   playlist.findIndex(clip => {
        //     console.log('clip',clip)
        //     return clip.id === currentClipId})
        // );
        // setCurrentClipIndex(currentClipId);
      })
      .catch((err) => {
        console.error('Error fetching current clip:', err);
        setCurrentClipIndex(null);
      });
  };

  // Parse the playlist data returned by HyperDeck
  const parsePlaylist = (data) => {
    const lines = data.split('\n');
    const clips = lines.filter(line => line.match(/^\d+:/)); // Find lines starting with clip number

    return clips.map((clip) => {
      const parts = clip.split(' ');
      const clipNumber = parts[0].replace(':', ''); // Clip number without ":"
      const clipName = parts[1];
      const startTimecode = parts[2];
      const duration = parts[3];
      return {
        id: clipNumber,
        name: clipName,
        startTimecode: startTimecode,
        duration: duration,
      };
    });
  };

  // Send control command (play, pause, stop, next, previous)
  const sendCommand = (command) => {
    fetch('http://localhost:4000/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    })
      .then((res) => res.text())
      .then((data) => setResponse(data))
      .catch((err) => setResponse('Error: ' + err));
  };

  // Play the next clip in the playlist
  const handleNext = () => {
    if (currentClipIndex !== null && currentClipIndex < playlist.length - 1) {
      const nextClipIndex = currentClipIndex + 1;
      setCurrentClipIndex(nextClipIndex);
      sendCommand(`goto: clip id: ${playlist[nextClipIndex].id}`);
    //   sendCommand(`goto: clip id: +1`);
    }
  };

  // Play the previous clip in the playlist
  const handlePrevious = () => {
    if (currentClipIndex !== null && currentClipIndex > 0) {
      const prevClipIndex = currentClipIndex - 1;
      setCurrentClipIndex(prevClipIndex);
    //   sendCommand(`goto: clip id: -1`);
      sendCommand(`goto: clip id: ${playlist[prevClipIndex].id}`);
    }
  };

  // Play a specific clip
  const playClip = (clipId) => {
    const clipIndex = playlist.findIndex(clip => clip.id === clipId);
    if (clipIndex !== -1) {
      setCurrentClipIndex(clipIndex);
      sendCommand(`goto: clip id: ${clipId}`);
    }
  };

  useEffect(() => {
    fetchPlaylist(); // Fetch playlist on component load
  }, [currentClipIndex]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>HyperDeck Control</h1>

      {/* Display the current playlist */}
      <h2>Current Playlist</h2>
      <ul>
        {playlist.length === 0 ? (
          <li>No clips found</li>
        ) : (
          playlist.map((clip, index) => (
            <li d
              key={clip.id}
              onClick={() => playClip(clip.id)}
              style={{ 
                backgroundColor: currentClipIndex === index ? '#d3d3d3' : 'transparent', 
                cursor: 'pointer' 
              }}
            >
              {clip.id}: {clip.name} (Start: {clip.startTimecode}, Duration: {clip.duration})
            </li>
          ))
        )}
      </ul>

      {/* Control buttons */}
      <div style={{ marginTop: '20px' }}>
      <button onClick={() => sendCommand('play: loop: true')}>Play on Loop</button>
        <button onClick={() => sendCommand('play')}>Play</button>
        <button onClick={() => sendCommand('play: speed: 0')}>Pause</button> {/* Updated Pause Command */}
        <button onClick={() => sendCommand('stop')}>Stop</button>
        <button onClick={handleNext}>Next</button>
        <button onClick={handlePrevious}>Previous</button>
      </div>

      {/* Display command response */}
      <h3>Response: {response}</h3>
    </div>
  );
}

export default App;
