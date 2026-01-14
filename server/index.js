const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Helper: Get Lat/Lon from City ---
const getGeoLocation = async (city) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search`;
    const response = await axios.get(url, {
      params: { q: city, format: 'json', limit: 1 },
      headers: {
        'User-Agent': 'RevBeat-Project/1.0', // Critical for Nominatim
      },
    });

    if (!response.data || response.data.length === 0) {
      throw new Error(`City '${city}' not found.`);
    }

    return {
      lat: response.data[0].lat,
      lon: response.data[0].lon,
      displayName: response.data[0].display_name,
    };
  } catch (error) {
    console.error('GeoLocation Error:', error.message);
    throw new Error('Failed to fetch location data.');
  }
};

// --- Helper: Get Weather ---
const getWeather = async (lat, lon) => {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast';
    const response = await axios.get(url, {
      params: {
        latitude: lat,
        longitude: lon,
        current_weather: true,
      },
    });

    return response.data.current_weather;
  } catch (error) {
    console.error('Weather API Error:', error.message);
    throw new Error('Failed to fetch weather data.');
  }
};

const mockTracks = require('./mockData.json');

// --- Helper: Get Recommendations (Mock) ---
const getMockRecommendations = (targets, limit) => {
  // Simple scoring: Distance from target valence/energy
  // Lower score is better
  const scoredTracks = mockTracks.map(track => {
    const valenceDiff = Math.abs(track.features.valence - targets.targetValence);
    const energyDiff = Math.abs(track.features.energy - targets.targetEnergy);
    
    // Bonus for genre match
    const genreMatch = track.features.genres.some(g => targets.seedGenres.includes(g));
    const genreBonus = genreMatch ? 0.2 : 0; // Subtract from distance if genre matches

    const distance = (valenceDiff + energyDiff) - genreBonus;
    return { ...track, score: distance };
  });

  // Sort by score (ascending) and take top N
  return scoredTracks.sort((a, b) => a.score - b.score).slice(0, limit);
};

// --- Main Endpoint ---
app.get('/api/recommend', async (req, res) => {
  try {
    const { city, mood, duration, localTime } = req.query;

    if (!city || !mood || !duration || !localTime) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Step 1: Context - Location
    const geo = await getGeoLocation(city);
    
    // Step 2: Context - Weather
    const weather = await getWeather(geo.lat, geo.lon);

    // Step 3: Domain Logic - Target Features
    const targets = calculateAudioTargets(weather.weathercode, mood, localTime);

    // Step 4: Catalog - Mock Data
    // Calculate limit: avg song ~3.5min (210s). 
    const limit = Math.ceil(parseInt(duration) * 60 / 210);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const tracks = getMockRecommendations(targets, safeLimit);

    res.json({
      context: {
        location: geo.displayName,
        weather: {
          code: weather.weathercode,
          temperature: weather.temperature,
        },
        targets,
      },
      tracks: tracks.map(t => ({
        id: t.id,
        name: t.name,
        artist: t.artist,
        album: "RevBeat Originals",
        image: t.image,
        preview_url: null, // No preview for mock
        spotify_url: t.url
      }))
    });

  } catch (error) {
    console.error('Handler Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`RevBeat Server running on port ${PORT}`);
});
