# RevBeat 🎧

RevBeat is a context-aware music recommendation system that crafts your audio experience based on your current environment. By analyzing your location, real-time weather, mood, and time of day, RevBeat suggests the perfect real-world tracks to match your vibe.

Live Demo: [rev-beat.vercel.app](https://rev-beat.vercel.app)

## 🚀 Features

- **Context Intelligence:** Automatically detects your current weather conditions and location via Open-Meteo and Nominatim APIs.
- **Dynamic Logic:** Adjusts music targets (Valence & Energy) based on environmental factors (e.g., lower valence for rainy days, higher energy for night drives).
- **Smart Input:** A custom, intuitive time input field that formats automatically as you type.
- **Curated Catalog:** Recommends a hand-picked selection of real-world International and Indonesian hits (Tulus, Sheila on 7, etc.) that truly represent the detected mood.
- **Production Ready:** Optimized for deployment with Docker and Vercel.

## 🛠 Tech Stack

### Frontend
- **React (Vite):** A fast, modern library for building the user interface.
- **Axios:** For handling API requests to the backend.
- **Vercel:** Cloud platform for hosting the frontend with seamless proxy rewrites.

### Backend
- **Node.js & Express:** Powering the core domain logic and recommendation engine.
- **Docker:** Containerized environment for consistent deployment across platforms.
- **GCP (Compute Engine):** Hosted on a Google Cloud VM.

## 📖 How to Use

1. **Enter Your Location:** Type in the city where you are (e.g., "Jakarta").
2. **Select Your Mood:** Choose the vibe you're feeling (Happy, Chill, Focus, or Night Drive).
3. **Set Departure Time:** Use the smart time input to tell the system when you're starting your journey.
4. **Define Duration:** Let us know how long your trip is in minutes.
5. **Get Recommendations:** Hit "Generate Playlist" and enjoy a curated list of tracks perfectly suited for your context.

## 💻 Local Development

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

The frontend is pre-configured to proxy requests to `http://localhost:3000` during development.