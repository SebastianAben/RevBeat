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

// --- Helper: Spotify Auth ---
const getSpotifyToken = async () => {
  try {
    const authString = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Spotify Auth Error:', error.message);
    throw new Error('Failed to authenticate with Spotify.');
  }
};

// --- Helper: Calculate Audio Features ---
const calculateAudioTargets = (weatherCode, mood, timeOfDay) => {
  let targetValence = 0.5;
  let targetEnergy = 0.5;
  let seedGenres = ['pop']; // Default

  // 1. Weather Impact
  // Codes > 50 generally imply rain/drizzle/snow in WMO code
  const isRaining = weatherCode >= 50; 
  if (isRaining) {
    targetValence -= 0.2; // Gloomy
    targetEnergy -= 0.1;
  } else {
    targetValence += 0.1; // Sunny/Clear
    targetEnergy += 0.1;
  }

  // 2. Mood Impact
  const lowerMood = mood.toLowerCase();
  if (lowerMood.includes('chill') || lowerMood.includes('relax')) {
    targetEnergy = 0.3;
    targetValence = 0.6;
    seedGenres = ['chill', 'acoustic', 'ambient'];
  } else if (lowerMood.includes('happy') || lowerMood.includes('party')) {
    targetEnergy = 0.8;
    targetValence = 0.9;
    seedGenres = ['pop', 'dance', 'party'];
  } else if (lowerMood.includes('focus') || lowerMood.includes('work')) {
    targetEnergy = 0.4;
    targetValence = 0.5;
    seedGenres = ['classical', 'study', 'piano'];
  } else if (lowerMood.includes('drive') || lowerMood.includes('road')) {
    targetEnergy = 0.7;
    targetValence = 0.6;
    seedGenres = ['rock', 'road-trip', 'indie'];
  }

  // 3. Time of Day Impact (Simple heuristic)
  const hour = parseInt(timeOfDay.split(':')[0], 10);
  const isNight = hour >= 20 || hour <= 5;
  
  if (isNight) {
    // Night drives often imply stable, slightly lower energy or atmospheric
    targetEnergy = Math.max(0.2, targetEnergy - 0.1); 
  }

  // Clamp values 0-1
  targetValence = Math.min(1, Math.max(0, targetValence));
  targetEnergy = Math.min(1, Math.max(0, targetEnergy));

  return { targetValence, targetEnergy, seedGenres };
};

// --- Helper: Get Recommendations ---
const getSpotifyRecommendations = async (token, targets, limit) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        limit: limit,
        seed_genres: targets.seedGenres.join(','),
        target_valence: targets.targetValence,
        target_energy: targets.targetEnergy,
      },
    });

    return response.data.tracks;
  } catch (error) {
    console.error('Spotify Recs Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch recommendations.');
  }
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

    // Step 4: Catalog - Spotify
    const token = await getSpotifyToken();
    
    // Calculate limit: avg song ~3.5min (210s). 
    // duration is in minutes. 
    const limit = Math.ceil(parseInt(duration) * 60 / 210);
    // Hard cap limit for Spotify API is 100, usually we want 10-20 for a playlist
    const safeLimit = Math.min(100, Math.max(1, limit));

    const tracks = await getSpotifyRecommendations(token, targets, safeLimit);

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
        artist: t.artists.map(a => a.name).join(', '),
        album: t.album.name,
        image: t.album.images[0]?.url,
        preview_url: t.preview_url,
        spotify_url: t.external_urls.spotify
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
