import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import StarField from '../components/StarField'

export default function GiftsPage() {
  const navigate = useNavigate()
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [openGift, setOpenGift] = useState(null)

  useEffect(() => {
    if (!api.hasSession()) { navigate('/'); return }
    api.getGifts().then(data => {
      setGifts(data.gifts || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const parseContent = (gift) => {
    try { return gift.content ? JSON.parse(gift.content) : null } catch { return null }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <StarField count={80} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(45,16,99,0.5) 0%, rgba(5,11,26,1) 65%)',
        pointerEvents: 'none',
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto', padding: 'clamp(20px, 5vw, 48px) 20px' }}>
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/game')} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '13px', marginBottom: '24px' }}>
            ← Back
          </button>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            background: 'linear-gradient(135deg, #f0d06a, #c9a84c)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '8px',
          }}>
            Gift Collection
          </h1>
          <p style={{ color: 'rgba(200,215,255,0.4)', fontSize: '14px' }}>
            Earned by completing levels. The best one is last.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(200,215,255,0.4)' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {gifts.map((gift, i) => {
              const content = parseContent(gift)
              return (
                <motion.div
                  key={gift.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => gift.unlocked && setOpenGift(gift)}
                  style={{
                    padding: 'clamp(16px, 4vw, 24px)',
                    background: gift.unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: gift.unlocked
                      ? '1px solid rgba(240,208,106,0.3)'
                      : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px',
                    cursor: gift.unlocked ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    boxShadow: gift.unlocked ? '0 0 20px rgba(240,208,106,0.08)' : 'none',
                    animation: gift.unlocked ? 'glow-pulse 3s ease-in-out infinite' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      fontSize: '32px', width: '56px', height: '56px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: gift.unlocked ? 'rgba(240,208,106,0.1)' : 'rgba(255,255,255,0.03)',
                      borderRadius: '14px', flexShrink: 0,
                    }}>
                      {gift.unlocked ? '🎁' : '🔒'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: 'Playfair Display, serif',
                        color: gift.unlocked ? '#f0d06a' : 'rgba(200,215,255,0.3)',
                        fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                        marginBottom: '4px',
                      }}>
                        {gift.title}
                      </h3>
                      <p style={{
                        color: gift.unlocked ? 'rgba(200,215,255,0.7)' : 'rgba(200,215,255,0.25)',
                        fontSize: '13px', lineHeight: 1.5,
                      }}>
                        {gift.description}
                      </p>
                    </div>
                    {gift.unlocked && (
                      <div style={{ color: 'rgba(200,215,255,0.3)', fontSize: '20px' }}>›</div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {/* Gift detail modal */}
      <AnimatePresence>
        {openGift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(5,11,26,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px', backdropFilter: 'blur(8px)',
            }}
            onClick={() => setOpenGift(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, rgba(45,16,99,0.95), rgba(10,22,40,0.98))',
                border: '1px solid rgba(240,208,106,0.3)',
                borderRadius: '24px',
                padding: 'clamp(24px, 5vw, 48px)',
                maxWidth: '520px', width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
                <h2 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                  color: '#f0d06a',
                }}>
                  {openGift.title}
                </h2>
              </div>

              {(() => {
                const content = parseContent(openGift)
                if (!content) return (
                  <p style={{ color: 'rgba(200,215,255,0.7)', lineHeight: 1.7, textAlign: 'center' }}>
                    {openGift.description}
                  </p>
                )

                if (openGift.gift_type === 'certificate' && content.certificate_text) return (
                  <div style={{
                    background: 'rgba(240,208,106,0.06)',
                    border: '1px solid rgba(240,208,106,0.2)',
                    borderRadius: '12px', padding: '20px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#f0d06a', marginBottom: '12px', textTransform: 'uppercase' }}>
                      {content.stamp}
                    </div>
                    <p style={{ color: 'rgba(248,249,255,0.9)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: '12px' }}>
                      "{content.certificate_text}"
                    </p>
                    <p style={{ color: 'rgba(200,215,255,0.4)', fontSize: '13px' }}>{content.signed}</p>
                  </div>
                )

                if (openGift.gift_type === 'memory' && content.message) return (
                  <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px', padding: '20px',
                    color: 'rgba(248,249,255,0.85)', lineHeight: 1.8,
                  }}>
                    {content.emoji && <div style={{ fontSize: '32px', marginBottom: '12px' }}>{content.emoji}</div>}
                    {content.message}
                  </div>
                )

                if (openGift.gift_type === 'cards' && content.cards) return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {content.cards.map((card, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{
                          padding: '12px 16px',
                          background: 'rgba(37,99,168,0.12)',
                          border: '1px solid rgba(37,99,168,0.25)',
                          borderRadius: '10px',
                          color: 'rgba(200,215,255,0.85)', fontSize: '14px', lineHeight: 1.6,
                        }}
                      >
                        🤍 {card.text}
                      </motion.div>
                    ))}
                  </div>
                )

                return <p style={{ color: 'rgba(200,215,255,0.7)', lineHeight: 1.7 }}>{openGift.description}</p>
              })()}

              <button
                onClick={() => setOpenGift(null)}
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: '24px' }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
