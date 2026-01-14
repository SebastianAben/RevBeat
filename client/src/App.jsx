import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    city: '',
    mood: '',
    duration: '',
    localTime: '08:00' // Default formatted time
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Smart Time Input Handler
  const handleTimeChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    
    // Limit to 4 digits (HHMM)
    if (val.length > 4) val = val.slice(0, 4);

    // Validate Hours (First 2 digits)
    if (val.length >= 2) {
      const hh = parseInt(val.slice(0, 2));
      if (hh > 23) val = '23' + val.slice(2);
    }

    // Validate Minutes (Next 2 digits)
    if (val.length >= 4) {
      const mm = parseInt(val.slice(2, 4));
      if (mm > 59) val = val.slice(0, 2) + '59';
    }

    // Format as HH:MM
    let formatted = val;
    if (val.length > 2) {
      formatted = val.slice(0, 2) + ':' + val.slice(2);
    }

    setFormData({ ...formData, localTime: formatted });
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
          localTime: formData.localTime // Send formatted string directly
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
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      backgroundColor: '#ffffff', 
      display: 'flex', 
      justifyContent: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#000', 
            margin: '0',
            letterSpacing: '-1.5px' 
          }}>RevBeat</h1>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>Context-Aware Audio Experience</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={fieldGroup}>
            <label style={labelStyle}>Where are you?</label>
            <input
              type="text"
              name="city"
              placeholder="Enter city name..."
              value={formData.city}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>What's the vibe?</label>
            <select name="mood" value={formData.mood} onChange={handleChange} required style={inputStyle}>
              <option value="">Select a mood...</option>
              <option value="happy">Happy & Energetic</option>
              <option value="chill">Chill & Relaxed</option>
              <option value="focus">Deep Focus</option>
              <option value="drive">Night Drive</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Start Time</label>
              <input 
                type="text" 
                name="localTime"
                placeholder="08:00" 
                value={formData.localTime} 
                onChange={handleTimeChange}
                maxLength={5}
                required
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: '2px', fontFamily: 'monospace' }}
              />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Duration (min)</label>
              <input
                type="number"
                name="duration"
                placeholder="30"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                style={inputStyle}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '10px',
              padding: '14px', 
              backgroundColor: '#000', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? 'Analyzing...' : 'Generate Playlist'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '20px', backgroundColor: '#fff5f5', color: '#c53030', padding: '12px', borderRadius: '8px', fontSize: '14px', border: '1px solid #feb2b2', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '40px', animation: 'fadeIn 0.6s ease' }}>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '30px', 
              border: '1px solid #eee'
            }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Current Context
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={statLabel}>Location</div>
                  <div style={statValue}>{result.context.location.split(',')[0]}</div>
                </div>
                <div>
                  <div style={statLabel}>Weather</div>
                  <div style={statValue}>{getWeatherDescription(result.context.weather.code)}</div>
                </div>
                <div>
                  <div style={statLabel}>Energy Target</div>
                  <div style={statValue}>{Math.round(result.context.targets.targetEnergy * 100)}%</div>
                </div>
                <div>
                  <div style={statLabel}>Vibe Match</div>
                  <div style={statValue}>{Math.round(result.context.targets.targetValence * 100)}%</div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Recommended Tracks</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {result.tracks.map((track) => (
                <div key={track.id} style={trackCardStyle}>
                  <img src={track.image} alt={track.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</div>
                    <div style={{ color: '#777', fontSize: '12px' }}>{track.artist}</div>
                  </div>
                  <a href={track.spotify_url} target="_blank" rel="noopener noreferrer" style={playButtonStyle}>Play</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Style Objects ---
const fieldGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '15px',
  backgroundColor: '#fff',
  color: '#000',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#4a5568',
  marginLeft: '2px'
}

const statLabel = {
  fontSize: '11px',
  color: '#a0aec0',
  fontWeight: '600'
}

const statValue = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#1a202c',
  marginTop: '2px'
}

const trackCardStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  padding: '10px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #edf2f7',
}

const playButtonStyle = {
  padding: '6px 16px',
  backgroundColor: '#f1f1f1',
  color: '#000',
  textDecoration: 'none',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '700'
}

function getWeatherDescription(code) {
  if (code === 0) return 'Clear Sky';
  if (code < 3) return 'Cloudy';
  if (code < 48) return 'Foggy';
  if (code < 55) return 'Drizzle';
  if (code < 65) return 'Rainy';
  if (code < 95) return 'Showers';
  return 'Stormy';
}

export default App