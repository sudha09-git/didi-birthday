import { useEffect, useRef, useState, useCallback } from 'react'

const AUDIO_SRC = '/audio/memory wall.mp3'
const TARGET_VOLUME = 0.35   // soft background — won't overpower visuals
const FADE_DURATION = 2500   // ms for fade-in
const FADE_STEPS = 40

/**
 * useMemoryAudio
 *
 * Manages background music for the PhotoWall.
 *
 * Returns:
 *   audioReady   – true when the file loaded successfully (hide controls if false)
 *   isPlaying    – current playback state
 *   needsPrompt  – true when autoplay was blocked; show "press play" UI
 *   volume       – current volume (0-1)
 *   togglePlay   – start/pause
 *   setVolume    – change volume
 *   startMusic   – used by the "Press play" prompt button
 */
export function useMemoryAudio() {
  const audioRef = useRef(null)
  const fadeTimer = useRef(null)
  const [audioReady, setAudioReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [needsPrompt, setNeedsPrompt] = useState(false)
  const [volume, setVolumeState] = useState(TARGET_VOLUME)

  // ── Create the Audio element once ──────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    audio.loop = true
    audio.volume = 0        // start silent; fade-in will bring it up
    audio.preload = 'auto'

    let canPlay = false

    const onCanPlay = () => {
      if (!canPlay) {
        canPlay = true
        setAudioReady(true)
        attemptAutoplay(audio)
      }
    }

    const onError = () => {
      // File missing or undecodeable — hide the control silently
      setAudioReady(false)
    }

    audio.addEventListener('canplaythrough', onCanPlay)
    audio.addEventListener('error', onError)

    // Set src after listeners are attached so events fire correctly
    audio.src = AUDIO_SRC
    audio.load()

    return () => {
      audio.removeEventListener('canplaythrough', onCanPlay)
      audio.removeEventListener('error', onError)
      clearFade()
      audio.pause()
      audio.src = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Attempt autoplay ───────────────────────────────────────────────────────
  function attemptAutoplay(audio) {
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
          setNeedsPrompt(false)
          fadeIn(audio)
        })
        .catch(() => {
          // Autoplay blocked — ask user to interact
          audio.pause()
          setIsPlaying(false)
          setNeedsPrompt(true)
        })
    }
  }

  // ── Fade helpers ───────────────────────────────────────────────────────────
  function clearFade() {
    if (fadeTimer.current) {
      clearInterval(fadeTimer.current)
      fadeTimer.current = null
    }
  }

  function fadeIn(audio) {
    clearFade()
    audio.volume = 0
    const step = TARGET_VOLUME / FADE_STEPS
    const interval = FADE_DURATION / FADE_STEPS
    fadeTimer.current = setInterval(() => {
      const next = Math.min(audio.volume + step, TARGET_VOLUME)
      audio.volume = next
      setVolumeState(next)
      if (next >= TARGET_VOLUME) {
        clearFade()
      }
    }, interval)
  }

  function fadeOut(audio, onDone) {
    clearFade()
    const step = audio.volume / FADE_STEPS
    fadeTimer.current = setInterval(() => {
      const next = Math.max(audio.volume - step, 0)
      audio.volume = next
      setVolumeState(next)
      if (next <= 0) {
        clearFade()
        audio.pause()
        if (onDone) onDone()
      }
    }, 30)
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  const startMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audioReady) return
    audio.currentTime = audio.currentTime   // no restart
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
          setNeedsPrompt(false)
          fadeIn(audio)
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioReady])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audioReady) return
    if (isPlaying) {
      fadeOut(audio, () => setIsPlaying(false))
    } else {
      startMusic()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioReady, isPlaying, startMusic])

  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    if (audioRef.current) audioRef.current.volume = clamped
  }, [])

  return { audioReady, isPlaying, needsPrompt, volume, togglePlay, setVolume, startMusic }
}
