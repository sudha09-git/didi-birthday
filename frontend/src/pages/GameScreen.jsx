import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import StarField from '../components/StarField'
import FairyLights from '../components/FairyLights'
import { useCountdown } from '../hooks/useServerTime'
import { useConfetti } from '../hooks/useConfetti'

// ---- Level Node (map dot) ----
function LevelNode({ level, isCurrent, onClick }) {
  const { level_number, status } = level

  const icon = status === 'completed' ? '✓'
    : status === 'available' ? String(level_number).padStart(2, '0')
    : '🔒'

  const color = status === 'completed' ? '#4ade80'
    : status === 'available' ? '#f0d06a'
    : 'rgba(200,215,255,0.25)'

  return (
    <motion.div
      whileHover={status === 'available' ? { scale: 1.1 } : {}}
      onClick={() => status === 'available' && onClick()}
      style={{
        width: '60px', height: '60px',
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: status === 'completed'
          ? 'rgba(74,222,128,0.12)'
          : status === 'available'
          ? 'rgba(240,208,106,0.12)'
          : 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: status === 'available' ? '16px' : '18px',
        color,
        fontWeight: 700,
        cursor: status === 'available' ? 'pointer' : 'default',
        boxShadow: isCurrent ? `0 0 20px ${color}80` : 'none',
        animation: isCurrent ? 'glow-pulse 2s ease-in-out infinite' : 'none',
        flexShrink: 0,
        fontFamily: 'monospace',
        position: 'relative',
        transition: 'all 0.2s',
      }}
    >
      {icon}
    </motion.div>
  )
}

// ---- Level Card (MCQ or text-input panel) ----
function LevelCard({ level, onAttempt }) {
  const isMCQ = Array.isArray(level.options) && level.options.length > 0

  const [answer, setAnswer] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hints, setHints] = useState([])
  const [hintLoading, setHintLoading] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [attempts, setAttempts] = useState(level.attempts || 0)
  const [timedOut, setTimedOut] = useState(false)
  const countdown = useCountdown(level.deadline_utc)
  const inputRef = useRef(null)

  useEffect(() => {
    setAnswer('')
    setSelectedKey(null)
    setFeedback(null)
    setAttempts(level.attempts || 0)
    setHints([])
    setShowHints(false)
    setTimedOut(false)
    if (!isMCQ) setTimeout(() => inputRef.current?.focus(), 100)
  }, [level.level_number])

  // Detect timeout
  useEffect(() => {
    if (countdown && countdown.total === 0 && feedback?.type !== 'correct') {
      setTimedOut(true)
    }
  }, [countdown, feedback?.type])

  const submitAnswer = async (value) => {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setFeedback(null)
    try {
      const result = await api.submitAttempt(level.level_number, trimmed)
      setAttempts(result.attempts_so_far)

      if (!result.is_correct) {
        setFeedback({ type: 'wrong', text: result.feedback })
        // For text input, clear; for MCQ, keep selection visible but allow retry
        if (!isMCQ) {
          setAnswer('')
          setTimeout(() => inputRef.current?.focus(), 50)
        } else {
          setSelectedKey(null)
        }
      } else {
        setFeedback({ type: 'correct', text: result.feedback })
        onAttempt(result)
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.message })
    }
    setLoading(false)
  }

  const handleTextSubmit = () => submitAnswer(answer)
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleTextSubmit() }
  const handleOptionClick = (key) => {
    if (loading || feedback?.type === 'correct') return
    setSelectedKey(key)
    submitAnswer(key)
  }

  const loadHint = async () => {
    setHintLoading(true)
    try {
      const nextHintNum = hints.length + 1
      const hint = await api.requestHint(level.level_number, nextHintNum)
      setHints(prev => [...prev, hint])
      setShowHints(true)
    } catch {
      // No more hints
    }
    setHintLoading(false)
  }

  const isCompleted = feedback?.type === 'correct'

  // If time is up and not solved, show timeout card
  if (timedOut && !isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(248,113,113,0.06)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '20px',
          padding: 'clamp(20px, 5vw, 36px)',
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#f87171', fontSize: '1.6rem', marginBottom: '12px' }}>
          TIME'S UP, DIDI.
        </h2>
        <p style={{ color: 'rgba(200,215,255,0.7)', lineHeight: 1.8, marginBottom: '8px' }}>
          Is level ko crack nahi kar payi...
        </p>
        <p style={{ color: 'rgba(200,215,255,0.5)', fontSize: '14px', fontStyle: 'italic' }}>
          Lekin Sudha ne decide kiya hai ki tumhe aage jaane diya jayega. 😂
        </p>
        <div style={{ marginTop: '20px', color: '#f0d06a', fontSize: '13px' }}>
          Agla level apne scheduled time par unlock hoga.
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: 'clamp(20px, 5vw, 36px)',
        backdropFilter: 'blur(16px)',
        maxWidth: '680px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '2px',
            color: '#f0d06a', textTransform: 'uppercase',
          }}>
            Level {String(level.level_number).padStart(2, '0')}
          </span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1rem, 3vw, 1.3rem)', marginTop: '4px', color: '#f8f9ff', lineHeight: 1.3 }}>
            {level.title}
          </h2>
        </div>
        {countdown && countdown.total > 0 && (
          <div style={{
            fontSize: '13px', color: countdown.total < 300 ? '#f87171' : 'rgba(200,215,255,0.6)',
            background: 'rgba(255,255,255,0.06)',
            padding: '6px 12px', borderRadius: '8px',
            fontFamily: 'monospace', flexShrink: 0,
          }}>
            ⏱ {countdown.formatted}
          </div>
        )}
      </div>

      {/* Question */}
      <div style={{
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
        color: 'rgba(200,215,255,0.88)',
        lineHeight: 1.9,
        marginBottom: '28px',
        whiteSpace: 'pre-line',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        borderLeft: '3px solid rgba(240,208,106,0.3)',
      }}>
        {level.question}
      </div>

      {/* MCQ Options */}
      {isMCQ ? (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {level.options.map((opt) => {
            const isSelected = selectedKey === opt.key
            const isCorrectOpt = isCompleted && isSelected
            return (
              <button
                key={opt.key}
                onClick={() => handleOptionClick(opt.key)}
                disabled={loading || isCompleted}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  padding: '14px 18px',
                  background: isCorrectOpt
                    ? 'rgba(74,222,128,0.12)'
                    : isSelected
                    ? 'rgba(240,208,106,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  border: isCorrectOpt
                    ? '1.5px solid rgba(74,222,128,0.5)'
                    : isSelected
                    ? '1.5px solid rgba(240,208,106,0.5)'
                    : '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: isCorrectOpt ? '#4ade80' : isSelected ? '#f0d06a' : 'rgba(200,215,255,0.85)',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  cursor: loading || isCompleted ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: `1.5px solid ${isCorrectOpt ? '#4ade80' : isSelected ? '#f0d06a' : 'rgba(255,255,255,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0,
                  color: isCorrectOpt ? '#4ade80' : isSelected ? '#f0d06a' : 'rgba(200,215,255,0.5)',
                }}>
                  {opt.key}
                </span>
                {opt.text}
              </button>
            )
          })}
        </div>
      ) : (
        /* Text Input (fallback for non-MCQ levels) */
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(200,215,255,0.45)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Apna Jawab Likho
          </div>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isCompleted}
            placeholder="Yahan likho..."
            style={{
              width: '100%',
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.06)',
              border: isCompleted
                ? '1.5px solid rgba(74,222,128,0.5)'
                : '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              color: '#f8f9ff',
              fontSize: '16px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { if (!isCompleted) e.target.style.borderColor = 'rgba(240,208,106,0.5)' }}
            onBlur={e => { if (!isCompleted) e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '14px',
              whiteSpace: 'pre-line',
              lineHeight: 1.7,
              background: feedback.type === 'correct'
                ? 'rgba(74,222,128,0.1)'
                : 'rgba(248,113,113,0.1)',
              border: `1px solid ${feedback.type === 'correct' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
              color: feedback.type === 'correct' ? '#4ade80' : '#f87171',
            }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions row — submit button only shown for text-input mode */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {!isMCQ && (
          <button
            onClick={handleTextSubmit}
            disabled={!answer.trim() || loading || isCompleted}
            className="btn btn-primary"
            style={{ flex: '1 1 auto', minWidth: '140px' }}
          >
            {loading ? 'Check ho raha hai...' : 'Submit Karo ✓'}
          </button>
        )}
        <button
          onClick={loadHint}
          disabled={hintLoading}
          className="btn btn-ghost"
          style={{ fontSize: '13px', padding: '12px 18px' }}
        >
          💡 {hintLoading ? 'Loading...' : 'Hint chahiye?'}
        </button>
        <span style={{ fontSize: '13px', color: 'rgba(200,215,255,0.4)', marginLeft: 'auto' }}>
          Attempts: {attempts}
        </span>
      </div>

      {/* Hints */}
      <AnimatePresence>
        {showHints && hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '20px', overflow: 'hidden' }}
          >
            {hints.map((h, i) => (
              <motion.div
                key={h.hint_number}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: '10px 14px',
                  marginBottom: '8px',
                  background: 'rgba(240,150,180,0.08)',
                  border: '1px solid rgba(240,150,180,0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'rgba(200,215,255,0.8)',
                }}
              >
                <span style={{ color: '#e8a0b0', fontWeight: 600, marginRight: '8px' }}>
                  Hint {h.hint_number}:
                </span>
                {h.hint_text}
              </motion.div>
            ))}
            {hints.length < 3 && (
              <button
                onClick={loadHint}
                disabled={hintLoading}
                style={{
                  fontSize: '13px', color: 'rgba(200,215,255,0.5)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                }}
              >
                {hintLoading ? 'Loading...' : '+ Aur hint dikhao'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ---- Memory Modal (gift) ----
function MemoryModal({ gift, onClose }) {
  const { burst } = useConfetti()

  useEffect(() => { burst() }, [])

  let content = null
  try { content = gift.content ? JSON.parse(gift.content) : null } catch { content = null }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(5,11,26,0.93)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(99,16,60,0.85), rgba(10,22,40,0.95))',
          border: '1px solid rgba(240,150,180,0.3)',
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 48px)',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 0 60px rgba(240,150,180,0.15)',
        }}
      >
        {content?.emoji && <div style={{ fontSize: '56px', marginBottom: '16px' }}>{content.emoji}</div>}
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
          color: '#f0d06a',
          marginBottom: '16px',
        }}>
          {gift.title}
        </h2>
        {content?.message && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            padding: '16px 20px',
            color: 'rgba(248,249,255,0.85)',
            lineHeight: 1.85,
            textAlign: 'left',
            fontSize: '14px',
            whiteSpace: 'pre-line',
            marginBottom: '24px',
          }}>
            {content.message}
          </div>
        )}
        <button onClick={onClose} className="btn btn-gold" style={{ width: '100%' }}>
          Aage Badhte Hain ✨
        </button>
      </motion.div>
    </motion.div>
  )
}

// ---- Level Cleared Overlay ----
function LevelClearedOverlay({ levelNumber, nextUnlockUtc, onContinue, gift, isLastLevel }) {
  const [showMemory, setShowMemory] = useState(false)
  const { burst } = useConfetti()
  const countdown = useCountdown(nextUnlockUtc)

  useEffect(() => { burst() }, [])

  const levelMessages = {
    1: { title: 'ACCESS GRANTED 💄', body: 'Obviously tumhe yaad hoga. Tumhari chhoti behen ne tumhara makeup kabhi tumhara rehne hi nahi diya.' },
    2: { title: 'YAD AA GAYI NA? 🌱', body: 'Mitti ke woh games shayad chhote the...\n\npar unmein jo duniya hum dono bana lete the, woh bahut badi thi. ❤️' },
    3: { title: 'VERDICT: BHAIYA AGAIN. ⚖️', body: 'Evidence clear tha. Witnesses biased the. Judge Mummy thi.\n\nCase closed. 😂' },
    4: { title: 'OPERATION JIJU — SUCCESSFUL 🤫', body: 'Mission kaafi secret tha...\n\nlekin Sudha ki aankhon se kuch nahi bachta tha.' },
    5: { title: 'MAASI LEVEL PASSED! 🍼', body: 'Tumhara beta hai...\ntechnically mera beta nahi...\n\nbut dil se? He will always be my first baby. ❤️' },
    6: { title: 'YOU GOT IT. ❤️', body: 'Shayad main har baar tumhari baat us waqt nahi samajhti...\n\nbut eventually, I do.\n\nAur shayad isi ko Didi hona kehte hain.' },
  }

  const msg = levelMessages[levelNumber] || { title: `LEVEL ${levelNumber} CLEAR!`, body: '' }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(5,11,26,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(10px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250 }}
        style={{
          maxWidth: '480px', width: '100%',
          background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(10,22,40,0.96))',
          border: '1px solid rgba(74,222,128,0.25)',
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 40px)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '52px', marginBottom: '8px' }}>🎉</div>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', color: '#f0d06a', marginBottom: '8px', textTransform: 'uppercase' }}>
          Level {String(levelNumber).padStart(2, '0')} Complete
        </div>
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
          color: '#4ade80',
          marginBottom: '16px',
          lineHeight: 1.3,
        }}>
          {msg.title}
        </h2>

        {msg.body && (
          <p style={{
            color: 'rgba(200,215,255,0.75)',
            lineHeight: 1.8,
            fontSize: '14px',
            marginBottom: '20px',
            whiteSpace: 'pre-line',
          }}>
            {msg.body}
          </p>
        )}

        {/* Last level — birthday countdown */}
        {isLastLevel ? (
          <div style={{
            padding: '16px',
            background: 'rgba(240,208,106,0.08)',
            border: '1px solid rgba(240,208,106,0.2)',
            borderRadius: '12px',
            marginBottom: '20px',
          }}>
            <div style={{ color: '#f0d06a', fontWeight: 600, marginBottom: '8px' }}>
              🔐✨ TREASURE HUNT COMPLETE
            </div>
            <p style={{ color: 'rgba(200,215,255,0.6)', fontSize: '13px', lineHeight: 1.7 }}>
              But yeh asli surprise nahi tha.
            </p>
            <p style={{ color: 'rgba(200,215,255,0.5)', fontSize: '13px', marginTop: '8px' }}>
              BIRTHDAY REVEAL UNLOCKS AT 12:00 AM.
            </p>
            {countdown && (
              <div style={{ fontFamily: 'monospace', fontSize: '2rem', color: '#f0d06a', fontWeight: 700, marginTop: '12px' }}>
                {countdown.formatted}
              </div>
            )}
          </div>
        ) : (
          /* Waiting for next level */
          nextUnlockUtc && countdown && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: 'rgba(200,215,255,0.5)', fontSize: '13px', marginBottom: '6px' }}>
                Next level unlocks in
              </p>
              <div style={{ fontFamily: 'monospace', fontSize: '2rem', color: '#f0d06a', fontWeight: 700 }}>
                {countdown.formatted}
              </div>
              <p style={{ color: 'rgba(200,215,255,0.35)', fontSize: '12px', marginTop: '4px' }}>
                Thoda wait karo, Didi. 😊
              </p>
            </div>
          )
        )}

        {gift && (
          <button
            onClick={() => setShowMemory(true)}
            className="btn btn-gold"
            style={{ width: '100%', marginBottom: '12px', fontSize: '15px' }}
          >
            💝 Yaad Kholo
          </button>
        )}

        <button onClick={onContinue} className="btn btn-ghost" style={{ width: '100%' }}>
          Map Par Wapas Jao
        </button>
      </motion.div>

      <AnimatePresence>
        {showMemory && gift && (
          <MemoryModal gift={gift} onClose={() => setShowMemory(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ---- Main Game Screen ----
export default function GameScreen() {
  const navigate = useNavigate()
  const [gameState, setGameState] = useState(null)
  const [currentLevel, setCurrentLevel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeLevel, setActiveLevel] = useState(null)
  const [cleared, setCleared] = useState(null)

  const fetchState = useCallback(async () => {
    try {
      const [state, lvl] = await Promise.all([
        api.getGameState(),
        api.getCurrentLevel(),
      ])
      setGameState(state)
      setCurrentLevel(lvl)

      // Auto-redirect to birthday world
      if (state.final_unlocked) {
        navigate('/birthday')
      }
    } catch (e) {
      if (e.message.includes('Session')) {
        navigate('/')
      }
      setError(e.message)
    }
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    if (!api.hasSession()) {
      navigate('/')
      return
    }
    fetchState()
    const id = setInterval(fetchState, 15000)
    return () => clearInterval(id)
  }, [fetchState])

  const handleAttemptResult = (result) => {
    if (result.level_cleared) {
      setCleared(result)
    }
  }

  const handleContinue = () => {
    setCleared(null)
    setActiveLevel(null)
    fetchState()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StarField />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', animation: 'float 2s ease-in-out infinite' }}>🌸</div>
          <p style={{ color: 'rgba(200,215,255,0.6)', marginTop: '16px' }}>Loading treasure hunt...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <StarField />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌸</div>
          <p style={{ color: '#f87171', marginBottom: '16px' }}>
            Kuch gadbad ho gayi. Sudha maafi mangti hai. 😂
          </p>
          <p style={{ color: 'rgba(200,215,255,0.5)', fontSize: '13px', marginBottom: '24px' }}>{error}</p>
          <button onClick={fetchState} className="btn btn-primary">Dobara Try Karo</button>
        </div>
      </div>
    )
  }

  const levels = gameState?.levels_summary || []
  const birthdayUnlockUtc = gameState?.levels_summary?.find(l => l.level_number === 6)?.deadline_utc

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <StarField count={100} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 30% 0%, rgba(99,16,60,0.4) 0%, rgba(5,11,26,1) 60%)',
        pointerEvents: 'none',
      }} />

      <main style={{ position: 'relative', zIndex: 1, padding: 'clamp(20px, 5vw, 40px)', maxWidth: '1000px', margin: '0 auto' }}>

        {/* Top nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', color: '#f0d06a', fontSize: '17px', fontWeight: 700 }}>
            🌸 Pooja Didi ka Treasure Hunt
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/story')} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '13px' }}>
              📖 Humari Kahani
            </button>
            <button onClick={() => navigate('/wall')} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '13px' }}>
              📸 Yaadein
            </button>
          </div>
        </div>

        {/* Map header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
            background: 'linear-gradient(135deg, #f0d06a, #e8a0b0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '8px',
          }}>
            The Treasure Map
          </h1>
          <p style={{ color: 'rgba(200,215,255,0.5)', fontSize: '14px' }}>
            6 levels. Ek raat. Aur ek birthday surprise jo midnight par unlock hoga.
          </p>
        </motion.div>

        {/* Quest path */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ color: gameState?.test_mode ? 'rgba(240,208,106,0.6)' : 'rgba(200,215,255,0.35)', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', marginBottom: '8px' }}>
            {gameState?.test_mode ? 'TEST MODE — ALL LEVELS OPEN' : 'START — 9:00 PM IST'}
          </div>

          {levels.map((lvl, i) => (
            <div key={lvl.level_number} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {i > 0 && (
                <div style={{
                  width: '2px', height: '28px',
                  background: lvl.status === 'completed'
                    ? 'rgba(74,222,128,0.5)'
                    : 'rgba(255,255,255,0.08)',
                }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <LevelNode
                  level={lvl}
                  isCurrent={currentLevel?.level_number === lvl.level_number && lvl.status === 'available'}
                  onClick={() => setActiveLevel(lvl.level_number)}
                />
                <div style={{ textAlign: 'left', minWidth: '180px' }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 600,
                    color: lvl.status === 'completed' ? '#4ade80'
                      : lvl.status === 'available' ? '#f8f9ff'
                      : 'rgba(200,215,255,0.3)',
                  }}>
                    {lvl.status === 'completed' ? '✓ Solved'
                      : lvl.status === 'available' ? '▶ Active — Tap to Play'
                      : '🔒 Locked'}
                  </div>
                  {lvl.status === 'locked' && (
                    <div style={{ fontSize: '11px', color: 'rgba(200,215,255,0.3)', marginTop: '2px' }}>
                      Unlocks at {new Date(lvl.unlock_time_utc).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST
                    </div>
                  )}
                  {lvl.status === 'available' && lvl.time_remaining_seconds != null && (
                    <div style={{ fontSize: '11px', color: '#f0d06a', marginTop: '2px' }}>
                      {Math.floor(lvl.time_remaining_seconds / 60)}m remaining
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Connector to midnight */}
          <div style={{ width: '2px', height: '28px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Midnight gate */}
          <div
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              border: gameState?.final_unlocked ? '2px solid #f0d06a' : '2px solid rgba(240,208,106,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
              background: gameState?.final_unlocked ? 'rgba(240,208,106,0.12)' : 'rgba(255,255,255,0.03)',
              animation: gameState?.final_unlocked ? 'glow-pulse 2s ease-in-out infinite' : 'none',
              cursor: gameState?.final_unlocked ? 'pointer' : 'default',
            }}
            onClick={() => gameState?.final_unlocked && navigate('/birthday')}
          >
            {gameState?.final_unlocked ? '🎂' : '🔐'}
          </div>
          <div style={{ color: 'rgba(200,215,255,0.35)', fontSize: '11px', marginTop: '6px', fontWeight: 600, letterSpacing: '1px' }}>
            {gameState?.final_unlocked ? 'BIRTHDAY REVEAL 🎂' : 'MIDNIGHT — 12:00 AM IST'}
          </div>
        </div>

        {/* Active level card */}
        <AnimatePresence>
          {activeLevel && currentLevel && currentLevel.status === 'available' && (
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', marginBottom: '16px' }}
              >
                <button
                  onClick={() => setActiveLevel(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(200,215,255,0.4)', cursor: 'pointer', fontSize: '13px' }}
                >
                  ← Map par wapas
                </button>
              </motion.div>
              {currentLevel.level_number !== activeLevel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '24px', color: 'rgba(200,215,255,0.5)', fontSize: '14px' }}
                >
                  Pehle Level {currentLevel.level_number} complete karo. ❤️
                </motion.div>
              )}
              {currentLevel.level_number === activeLevel && (
                <LevelCard
                  level={currentLevel}
                  onAttempt={handleAttemptResult}
                />
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Waiting state — game not started */}
        {!activeLevel && currentLevel?.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
            <p style={{ color: 'rgba(200,215,255,0.7)' }}>
              TEST MODE — Treasure Hunt is open for testing right now.
            </p>
          </motion.div>
        )}

        {/* All levels complete — waiting for midnight */}
        {currentLevel?.status === 'all_complete' && !gameState?.final_unlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌙</div>
            <p style={{ color: '#f0d06a', fontSize: '18px', fontFamily: 'Playfair Display, serif', marginBottom: '12px' }}>
              Treasure Hunt Complete! 🎉
            </p>
            <p style={{ color: 'rgba(200,215,255,0.6)', marginBottom: '20px' }}>
              Lekin asli surprise abhi baki hai, Didi.
            </p>
            <p style={{ color: 'rgba(200,215,255,0.4)', fontSize: '14px' }}>
              Birthday Reveal 12:00 AM IST par unlock hogi. ❤️
            </p>
          </motion.div>
        )}

      </main>

      {/* Level cleared overlay */}
      <AnimatePresence>
        {cleared && (
          <LevelClearedOverlay
            levelNumber={currentLevel?.level_number}
            nextUnlockUtc={cleared.next_level_unlock_utc || birthdayUnlockUtc}
            gift={cleared.gift_unlocked}
            onContinue={handleContinue}
            isLastLevel={currentLevel?.level_number === 6}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
