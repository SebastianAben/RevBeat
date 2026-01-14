import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    city: '',
    mood: '',
    duration: '',
    localTime: '',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.get('/api/recommend', {
        params: {
          city: formData.city,
          mood: formData.mood,
          duration: formData.duration,
          localTime: formData.localTime
        }
      })
      setResult(response.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to fetch recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>RevBeat 🎧</h1>
      <p>Context-Aware Music Recommendations</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>City</label>
          <input
            type="text"
            name="city"
            placeholder="e.g. Jakarta"
            value={formData.city}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Mood</label>
          <select
            name="mood"
            value={formData.mood}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Select Mood</option>
            <option value="happy">Happy / Party</option>
            <option value="chill">Chill / Relax</option>
            <option value="focus">Focus / Work</option>
            <option value="drive">Night Drive / Road Trip</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Start Time</label>
            <input
              type="time"
              name="localTime"
              value={formData.localTime}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Trip Duration (mins)</label>
            <input
              type="number"
              name="duration"
              placeholder="e.g. 30"
              value={formData.duration}
              onChange={handleChange}
              required
              min="1"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '1rem', 
            backgroundColor: '#1DB954', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Generating Vibe...' : 'Get Recommendations'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', border: '1px solid red' }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', color: '#333' }}>
            <h3>Context Detected</h3>
            <p><strong>📍 Location:</strong> {result.context.location}</p>
            <p><strong>🌤️ Weather Code:</strong> {result.context.weather.code} (Temp: {result.context.weather.temperature}°C)</p>
            <p><strong>🎯 Targets:</strong> Energy: {result.context.targets.targetEnergy.toFixed(2)}, Valence: {result.context.targets.targetValence.toFixed(2)}</p>
          </div>

          <h3>Your Playlist</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {result.tracks.map((track) => (
              <div key={track.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
                {track.image && <img src={track.image} alt={track.album} style={{ width: '64px', height: '64px', borderRadius: '4px' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{track.name}</div>
                  <div style={{ color: '#666' }}>{track.artist}</div>
                </div>
                <a 
                  href={track.spotify_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#191414', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '20px',
                    fontSize: '0.8rem' 
                  }}
                >
                  Play
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App