import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'

export function useServerTime() {
  const [timeData, setTimeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const fetchTime = async () => {
    try {
      const data = await api.getServerTime()
      setTimeData(data)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTime()
    // Poll every 10s to keep server time accurate
    intervalRef.current = setInterval(fetchTime, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return { timeData, loading, refetch: fetchTime }
}

export function useCountdown(targetUtc) {
  const [seconds, setSeconds] = useState(null)

  useEffect(() => {
    if (!targetUtc) return
    const target = new Date(targetUtc).getTime()

    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSeconds(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetUtc])

  if (seconds === null) return null

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return {
    total: seconds,
    hours: h,
    minutes: m,
    seconds: s,
    formatted: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
  }
}
