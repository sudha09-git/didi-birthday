import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import StarField from '../components/StarField'

// ---- Level Editor Modal ----
function LevelEditor({ level, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: level.title,
    question: level.question,
    correct_answer: level.correct_answer,
    unlock_time_utc: level.unlock_time_utc,
    deadline_utc: level.deadline_utc,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.adminUpdateLevel(token, level.id, form)
      setMsg({ type: 'ok', text: 'Saved!' })
      onSaved()
    } catch (e) {
      setMsg({ type: 'err', text: e.message })
    }
    setSaving(false)
  }

  const field = (key, label, multiline = false) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: 'rgba(200,215,255,0.5)', marginBottom: '6px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={5}
          style={inputStyle}
        />
      ) : (
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={inputStyle}
        />
      )}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(5,11,26,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(10,22,40,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '28px',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#f0d06a', marginBottom: '20px', fontSize: '1.2rem' }}>
          Edit Level {level.level_number}
        </h3>
        {field('title', 'Title')}
        {field('question', 'Question', true)}
        {field('correct_answer', 'Correct Answer (use | to separate multiple valid answers)')}
        {field('unlock_time_utc', 'Unlock Time UTC (ISO)')}
        {field('deadline_utc', 'Deadline UTC (ISO)')}

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px',
            background: msg.type === 'ok' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
            color: msg.type === 'ok' ? '#4ade80' : '#f87171',
          }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---- Player Card ----
function PlayerCard({ player }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      marginBottom: '16px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', color: '#f8f9ff',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '20px' }}>🌸</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{player.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(200,215,255,0.4)', marginTop: '2px' }}>
              Session: {player.session_id} · Last seen: {player.last_seen ? new Date(player.last_seen).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' IST' : '—'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {/* Level badges */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5, 6].map(ln => {
              const done = (player.completed_levels || []).includes(ln)
              return (
                <div key={ln} style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                  background: done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${done ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: done ? '#4ade80' : 'rgba(200,215,255,0.3)',
                }}>
                  {done ? '✓' : ln}
                </div>
              )
            })}
          </div>
          {player.final_unlocked && <span style={{ color: '#f0d06a', fontSize: '18px' }}>🎂</span>}
          <span style={{ color: 'rgba(200,215,255,0.4)', fontSize: '16px' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded level stats */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 20px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '16px',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {(player.level_stats || []).map(ls => (
                  <div key={ls.level_number} style={{
                    padding: '12px 16px',
                    background: ls.status === 'completed' ? 'rgba(74,222,128,0.07)'
                      : ls.timed_out ? 'rgba(248,113,113,0.05)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${ls.status === 'completed' ? 'rgba(74,222,128,0.2)'
                      : ls.timed_out ? 'rgba(248,113,113,0.15)'
                      : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '12px',
                    minWidth: '150px',
                    flex: '1 1 150px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: ls.status === 'completed' ? '#4ade80' : ls.timed_out ? '#f87171' : 'rgba(200,215,255,0.6)' }}>
                        L{ls.level_number}
                      </span>
                      {ls.status === 'completed' && <span style={{ color: '#4ade80', fontSize: '12px' }}>✓ Solved</span>}
                      {ls.timed_out && <span style={{ color: '#f87171', fontSize: '11px' }}>⏰ Timeout</span>}
                      {ls.status === 'available' && !ls.timed_out && <span style={{ color: '#f0d06a', fontSize: '11px' }}>▶ Active</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(200,215,255,0.45)', lineHeight: 1.8 }}>
                      <div>Attempts: <span style={{ color: 'rgba(200,215,255,0.7)' }}>{ls.total_attempts}</span></div>
                      <div>Hints: <span style={{ color: 'rgba(200,215,255,0.7)' }}>{ls.hints_used}</span></div>
                      {ls.solved_at && (
                        <div>Solved: <span style={{ color: '#4ade80' }}>
                          {new Date(ls.solved_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
                        </span></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---- Main Admin Dashboard ----
export default function AdminDashboard() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState(null)
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [loginErr, setLoginErr] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const [stats, setStats] = useState(null)
  const [levels, setLevels] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [editingLevel, setEditingLevel] = useState(null)
  const [tab, setTab] = useState('overview') // overview | levels

  // Restore token from sessionStorage
  useEffect(() => {
    const t = sessionStorage.getItem('admin_token')
    if (t) {
      setToken(t)
      setLoggedIn(true)
    }
  }, [])

  const fetchData = useCallback(async (t) => {
    const tok = t || token
    if (!tok) return
    setLoadingStats(true)
    try {
      const [s, l] = await Promise.all([
        api.adminStats(tok),
        api.adminGetLevels(tok),
      ])
      setStats(s)
      setLevels(l.levels || [])
    } catch (e) {
      if (e.message.includes('401') || e.message.includes('403')) {
        setLoggedIn(false)
        setToken(null)
        sessionStorage.removeItem('admin_token')
      }
    }
    setLoadingStats(false)
  }, [token])

  useEffect(() => {
    if (loggedIn && token) {
      fetchData(token)
      const id = setInterval(() => fetchData(token), 20000)
      return () => clearInterval(id)
    }
  }, [loggedIn, token, fetchData])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoggingIn(true)
    setLoginErr(null)
    try {
      const data = await api.adminLogin(creds.username, creds.password)
      setToken(data.token)
      sessionStorage.setItem('admin_token', data.token)
      setLoggedIn(true)
      fetchData(data.token)
    } catch (e) {
      setLoginErr(e.message)
    }
    setLoggingIn(false)
  }

  // ---- Login Screen ----
  if (!loggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050b1a', padding: '20px',
      }}>
        <StarField count={60} />
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '400px', width: '100%',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#f0d06a' }}>
              SUDHA'S CONTROL ROOM
            </h1>
            <p style={{ color: 'rgba(200,215,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
              Pooja Didi Birthday Treasure Hunt
            </p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(200,215,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              Username
            </label>
            <input
              type="text"
              value={creds.username}
              onChange={e => setCreds(c => ({ ...c, username: e.target.value }))}
              autoComplete="username"
              style={{ ...inputStyle, display: 'block', width: '100%' }}
              placeholder="sudha"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(200,215,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password"
              value={creds.password}
              onChange={e => setCreds(c => ({ ...c, password: e.target.value }))}
              autoComplete="current-password"
              style={{ ...inputStyle, display: 'block', width: '100%' }}
              placeholder="••••••••"
            />
          </div>

          {loginErr && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '14px',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
              color: '#f87171', fontSize: '13px',
            }}>
              {loginErr}
            </div>
          )}

          <button
            type="submit"
            disabled={loggingIn || !creds.username || !creds.password}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {loggingIn ? 'Logging in...' : 'Enter Control Room'}
          </button>
        </motion.form>
      </div>
    )
  }

  // ---- Dashboard ----
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#050b1a' }}>
      <StarField count={60} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 0%, rgba(10,22,40,0.9) 0%, rgba(5,11,26,1) 60%)',
        pointerEvents: 'none',
      }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#f0d06a' }}>
              🌸 SUDHA'S CONTROL ROOM
            </h1>
            {stats && (
              <p style={{ fontSize: '13px', color: 'rgba(200,215,255,0.4)', marginTop: '4px' }}>
                Server: {stats.server_time_ist} ·{' '}
                {stats.birthday_unlocked ? '🎂 Birthday unlocked!' : `Treasure hunt starts: ${new Date(stats.game_starts_utc).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST`}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => fetchData()} disabled={loadingStats} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '13px' }}>
              {loadingStats ? '↻ Refreshing...' : '↻ Refresh'}
            </button>
            <button
              onClick={() => { setLoggedIn(false); setToken(null); sessionStorage.removeItem('admin_token') }}
              className="btn btn-ghost"
              style={{ padding: '8px 14px', fontSize: '13px', color: '#f87171' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {['overview', 'levels'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600,
                background: tab === t ? 'rgba(37,99,168,0.4)' : 'transparent',
                color: tab === t ? '#f8f9ff' : 'rgba(200,215,255,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {t === 'overview' ? '📊 Overview' : '📝 Levels'}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div>
            {/* Summary stats */}
            {stats && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
                {[
                  { label: 'Total Players', value: stats.total_players, color: '#f0d06a' },
                  { label: 'Birthday Unlocked', value: stats.birthday_unlocked ? 'YES 🎂' : 'NO', color: stats.birthday_unlocked ? '#4ade80' : '#f87171' },
                  { label: 'Server Time IST', value: stats.server_time_ist.split(' ').slice(-2).join(' '), color: 'rgba(200,215,255,0.7)' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '16px 22px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    flex: '1 1 160px',
                  }}>
                    <div style={{ fontSize: '12px', color: 'rgba(200,215,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: s.color, fontFamily: 'Playfair Display, serif' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Players */}
            <h2 style={{ color: '#f8f9ff', fontSize: '15px', fontWeight: 600, marginBottom: '16px', letterSpacing: '0.5px' }}>
              Pooja's Progress ({stats?.total_players || 0} session{stats?.total_players !== 1 ? 's' : ''})
            </h2>
            {loadingStats && !stats ? (
              <div style={{ color: 'rgba(200,215,255,0.4)', padding: '40px', textAlign: 'center' }}>Loading...</div>
            ) : stats?.players?.length === 0 ? (
              <div style={{ color: 'rgba(200,215,255,0.3)', padding: '40px', textAlign: 'center' }}>
                Pooja ne abhi start nahi kiya. Treasure hunt 5 Oct 9 PM par shuru hogi.
              </div>
            ) : (
              (stats?.players || []).map(p => <PlayerCard key={p.id} player={p} />)
            )}
          </div>
        )}

        {/* Levels tab */}
        {tab === 'levels' && (
          <div>
            <p style={{ color: 'rgba(200,215,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>
              Edit question text, timing, and correct answers. Changes take effect immediately.
            </p>
            {levels.map(lvl => (
              <div key={lvl.id} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', color: '#f0d06a', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Level {lvl.level_number}
                    </div>
                    <div style={{ color: '#f8f9ff', fontFamily: 'Playfair Display, serif', fontSize: '15px', marginBottom: '8px' }}>
                      {lvl.title}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(200,215,255,0.4)' }}>
                      <span>Unlock: {new Date(lvl.unlock_time_utc).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST</span>
                      <span>Deadline: {new Date(lvl.deadline_utc).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST</span>
                      <span>Answer(s): <span style={{ color: '#f0d06a', fontWeight: 700 }}>{lvl.correct_answer}</span></span>
                    </div>
                    {(lvl.hints || []).length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(200,215,255,0.35)' }}>
                        {lvl.hints.length} hint{lvl.hints.length !== 1 ? 's' : ''} configured
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingLevel(lvl)}
                    className="btn btn-ghost"
                    style={{ padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}
                  >
                    ✏️ Edit
                  </button>
                </div>

                {/* No MCQ options for Pooja's hunt — text input */}
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(200,215,255,0.3)' }}>
                  Text-input level (no MCQ options)
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit modal */}
      <AnimatePresence>
        {editingLevel && (
          <LevelEditor
            level={editingLevel}
            token={token}
            onClose={() => setEditingLevel(null)}
            onSaved={() => { fetchData(); setEditingLevel(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f8f9ff',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  resize: 'vertical',
  outline: 'none',
}
