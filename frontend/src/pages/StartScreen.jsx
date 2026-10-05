import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import StarField from '../components/StarField'
import FairyLights from '../components/FairyLights'
import { useServerTime, useCountdown } from '../hooks/useServerTime'

const features = [
  { icon: '🔐', label: '6 Levels' },
  { icon: '💡', label: 'Hints' },
  { icon: '♾️', label: 'Unlimited Attempts' },
  { icon: '💝', label: 'Memories' },
  { icon: '🎂', label: 'Birthday Surprise' },
]

const floatingEmojis = ['💄', '🎂', '💝', '⭐', '🌙', '✨', '🌸', '💫']

export default function StartScreen() {
  const navigate = useNavigate()
  const { timeData, loading } = useServerTime()
  const countdown = useCountdown(timeData?.next_event_utc)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  // If session exists, go straight to game
  useEffect(() => {
    if (api.hasSession()) {
      navigate('/game')
    }
  }, [])

  const handleStart = async () => {
    setStarting(true)
    setError(null)
    try {
      await api.startGame()
      navigate('/game')
    } catch (e) {
      setError(e.message)
      setStarting(false)
    }
  }

  const gameNotStarted = timeData && !timeData.game_started

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <StarField count={150} />

      {/* Gradient background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,16,60,0.7) 0%, rgba(5,11,26,1) 65%)',
        pointerEvents: 'none',
      }} />

      {/* Floating emojis */}
      {floatingEmojis.map((emoji, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: `${8 + i * 12}%`,
          top: `${15 + (i % 3) * 25}%`,
          fontSize: `${16 + (i % 3) * 8}px`,
          opacity: 0.12,
          animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
        }}>
          {emoji}
        </div>
      ))}

      <FairyLights count={24} />

      <main style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px 40px',
        textAlign: 'center',
      }}>

        {/* Flower badge */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          style={{
            fontSize: '64px',
            marginBottom: '24px',
            filter: 'drop-shadow(0 0 20px rgba(240,150,180,0.5))',
          }}
        >
          🌸
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(2.2rem, 8vw, 4.5rem)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f0d06a, #e8a0b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
            lineHeight: 1.1,
          }}
        >
          WELCOME, DIDI ❤️
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            color: 'rgba(200, 215, 255, 0.8)',
            maxWidth: '520px',
            marginBottom: '20px',
            lineHeight: 1.7,
          }}
        >
          Tumhari chhoti behen ne ek khaas raat ki tayyari ki hai.
          <br />
          <span style={{ color: 'rgba(200, 215, 255, 0.5)', fontSize: '0.9em' }}>
            Ek treasure hunt. Poori raat. Sirf tumhare liye.
          </span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          style={{
            fontSize: '13px',
            color: 'rgba(240,150,180,0.7)',
            marginBottom: '40px',
            fontStyle: 'italic',
          }}
        >
          — Sudha Goma Chudail 😈❤️
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '48px',
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '40px',
                fontSize: '14px',
                color: 'rgba(248,249,255,0.8)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ fontSize: '18px' }}>{f.icon}</span>
              {f.label}
            </motion.div>
          ))}
        </motion.div>

        {/* Schedule preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            marginBottom: '40px',
            padding: '16px 24px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            maxWidth: '420px',
            width: '100%',
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(200,215,255,0.5)', letterSpacing: '2px', marginBottom: '12px', textTransform: 'uppercase' }}>
            5 October ka Schedule
          </div>
          {[
            ['9:00 PM', 'Level 01'],
            ['9:30 PM', 'Level 02'],
            ['10:00 PM', 'Level 03'],
            ['10:30 PM', 'Level 04'],
            ['11:00 PM', 'Level 05'],
            ['11:30 PM', 'Level 06'],
            ['12:00 AM', '🎂 Birthday Reveal'],
          ].map(([time, label]) => (
            <div key={time} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: label.includes('Birthday') ? '#f0d06a' : 'rgba(200,215,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span>{time}</span>
              <span>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Countdown or Start Button */}
        {loading ? (
          <div style={{ color: 'rgba(200,215,255,0.5)' }}>Loading...</div>
        ) : gameNotStarted && countdown ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            style={{ textAlign: 'center', marginBottom: '32px' }}
          >
            <p style={{ color: 'rgba(200,215,255,0.6)', marginBottom: '12px', fontSize: '14px' }}>
              {timeData.next_event_label}
            </p>
            <div style={{
              fontFamily: 'Playfair Display, monospace',
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              color: '#f0d06a',
              fontWeight: 700,
              letterSpacing: '4px',
              textShadow: '0 0 30px rgba(240,208,106,0.5)',
            }}>
              {countdown.formatted}
            </div>
            <p style={{ color: 'rgba(200,215,255,0.4)', fontSize: '13px', marginTop: '8px' }}>
              Thodi der aur intezaar karo, Didi. ❤️
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {error && (
              <div style={{
                color: '#f87171', fontSize: '14px', marginBottom: '16px',
                padding: '10px 16px', background: 'rgba(248,113,113,0.1)',
                borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)',
              }}>
                {error}
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={starting}
              className="btn btn-gold"
              style={{ fontSize: '18px', padding: '18px 40px', borderRadius: '16px' }}
            >
              {starting ? 'Shuru ho rahi hai...' : '🔐  TREASURE HUNT SHURU KARO'}
            </button>
          </motion.div>
        )}

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            marginTop: '48px',
            color: 'rgba(200,215,255,0.3)',
            fontSize: '13px',
          }}
        >
          Banaya gaya Sudha ne 🤍 · Pooja Didi ke 26th Birthday ke liye
        </motion.p>
      </main>
    </div>
  )
}
