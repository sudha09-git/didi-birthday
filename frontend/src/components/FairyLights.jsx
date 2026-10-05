import { useEffect, useRef } from 'react'

export default function FairyLights({ count = 20 }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: '60px',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 1,
    }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* String */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <path
            d={`M0,20 Q${25}%,35 ${50}%,20 Q${75}%,5 100%,20`}
            stroke="rgba(200,200,200,0.25)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
        {/* Bulbs */}
        {Array.from({ length: count }, (_, i) => {
          const pct = (i / (count - 1)) * 100
          const yOffset = Math.sin((pct / 100) * Math.PI * 2) * 8 + 20
          const hue = (i * 30) % 360
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: `${yOffset}px`,
                width: '6px',
                height: '8px',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                background: `hsl(${hue}, 80%, 70%)`,
                boxShadow: `0 0 6px 2px hsl(${hue}, 80%, 60%)`,
                animation: `twinkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                transform: 'translateX(-50%)',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
