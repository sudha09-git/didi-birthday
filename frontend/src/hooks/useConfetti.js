import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function useConfetti() {
  const fire = (options = {}) => {
    confetti({
      particleCount: options.count || 120,
      spread: options.spread || 70,
      origin: options.origin || { y: 0.6 },
      colors: options.colors || ['#c9a84c', '#f0d06a', '#2563a8', '#7c3aed', '#ffffff'],
      ...options,
    })
  }

  const burst = () => {
    const count = 200
    const defaults = { origin: { y: 0.7 } }

    fire({ ...defaults, particleCount: Math.floor(count * 0.25), spread: 26, startVelocity: 55 })
    fire({ ...defaults, particleCount: Math.floor(count * 0.2), spread: 60 })
    fire({ ...defaults, particleCount: Math.floor(count * 0.35), spread: 100, decay: 0.91, scalar: 0.8 })
    fire({ ...defaults, particleCount: Math.floor(count * 0.1), spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire({ ...defaults, particleCount: Math.floor(count * 0.1), spread: 120, startVelocity: 45 })
  }

  const slowCelebration = () => {
    const duration = 8000
    const end = Date.now() + duration
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#c9a84c', '#7c3aed', '#2563a8'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#c9a84c', '#7c3aed', '#2563a8'],
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  return { fire, burst, slowCelebration }
}
