const API_BASE = '/api'

const SESSION_KEY = 'pooja_birthday_session'

function getSession() {
  return localStorage.getItem(SESSION_KEY)
}

function setSession(sessionId) {
  localStorage.setItem(SESSION_KEY, sessionId)
}

async function request(path, options = {}) {
  const sessionId = getSession()
  const headers = {
    'Content-Type': 'application/json',
    ...(sessionId ? { 'x-session-id': sessionId } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Something went wrong' }))
    throw new Error(err.detail || 'Request failed')
  }

  return res.json()
}

export const api = {
  // Server time (no session needed)
  getServerTime: () => request('/game/server-time'),

  // Start game
  startGame: () =>
    request('/game/start', { method: 'POST' }).then(data => {
      setSession(data.session_id)
      return data
    }),

  // Game state (requires session)
  getGameState: () => request('/game/state'),

  // Current level
  getCurrentLevel: () => request('/game/current-level'),

  // Submit text answer
  submitAttempt: (levelNumber, answer, questionType = 'main') =>
    request('/game/attempt', {
      method: 'POST',
      body: JSON.stringify({
        session_id: getSession(),
        level_number: levelNumber,
        selected_answer: answer,
        question_type: questionType,
      }),
    }),

  // Request hint
  requestHint: (levelNumber, hintNumber) =>
    request('/game/hint', {
      method: 'POST',
      body: JSON.stringify({
        session_id: getSession(),
        level_number: levelNumber,
        hint_number: hintNumber,
      }),
    }),

  // Memories (gifts)
  getGifts: () => request('/game/gifts'),

  // Photos
  getPhotos: () => request('/game/photos'),

  // Check if session exists
  hasSession: () => !!getSession(),
  getSession,
  setSession,

  // Admin
  adminLogin: (username, password) =>
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  adminStats: (token) =>
    request('/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetLevels: (token) =>
    request('/admin/levels', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUpdateLevel: (token, levelId, data) =>
    request(`/admin/levels/${levelId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
}
