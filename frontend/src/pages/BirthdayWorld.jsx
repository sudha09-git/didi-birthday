import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import StarField from '../components/StarField'
import { useConfetti } from '../hooks/useConfetti'
import { api } from '../services/api'

// ---- Cinematic transition messages ----
const transitionMessages = [
  "5 October, 11:59 PM...",
  "Happy 26th Birthday, Didi. ❤️",
]

// ---- Story chapters data ----
const storyChapters = [
  {
    id: 'once',
    emoji: '🌱',
    title: 'ONCE UPON A TIME',
    subtitle: 'Bachpan',
    content: [
      'Ek ghar tha. Ek angan tha. Aur do chhoti bacchiyaan thi jo usi angan mein puri duniya dhoondh leti thi.',
      'Na koi gadget tha, na koi distraction. Bas thodi si mitti, ek dusre ki company, aur imagination ki koi seema nahi.',
      'Rasoi bante the, ghar bante the, kahaaniyaan banti thi — un khelon mein jo bahar se chhote lagte the lekin andar se bahut bade hote the.',
      'Cycle pe school jaana. Ek saath. Woh roz ka woh ek ghanta jo ab kitna chhota lagta hai — par us waqt woh poori duniya thi.',
    ],
    photos: ['memory-01.jpg', 'memory-02.jpg'],
  },
  {
    id: 'world',
    emoji: '🚪',
    title: 'OUR LITTLE WORLD',
    subtitle: 'Ek Kamra, Do Bahenen',
    content: [
      'Ek hi kamra tha. Ek hi almirah tha. Ek hi bed tha.',
      'Aur jo lipstick ek taraf ki thi, woh roz dusri taraf chali jaati thi.',
      'Lakeerain bhi thi — "Yeh mera side hai, yeh tumhara." But raat ko thanda lagta tha toh woh lakeerain kahin kho jaati thi.',
      'Fights bhi thi. Rozana ki. Clothes ke liye. Makeup ke liye. Remote ke liye. Lekin woh fights bhi ek tarah ka love tha — abhi samajh aa raha hai.',
      'Woh choti si duniya kitni badi thi, tab pata nahi tha. Ab pata hai.',
    ],
    photos: ['memory-03.jpg', 'memory-04.jpg'],
  },
  {
    id: 'vidai',
    emoji: '🌸',
    title: 'AND THEN YOU LEFT',
    subtitle: 'Vidai',
    content: [
      'Shadi ho gayi. Woh din aaya jo kabhi nahi aana chahiye tha — ya shayad aana chahiye tha, kyunki tumhari khushi thi — lekin jo dil ko ek baar toh todta zaroor tha.',
      'Vidai.',
      'Woh almirah jo hamesha half-open rehti thi, band ho gayi.',
      'Woh side jo tumhari thi, khaali ho gayi.',
      'Kamra wahi tha. Ghar wahi tha. Lekin kuch nahi tha jo pehle tha.',
      'Chhoti behen pehli baar samajhi ki jo cheez "common" lagi thi, woh actually rare thi.',
    ],
    photos: ['memory-05.jpg'],
  },
  {
    id: 'shivay',
    emoji: '🍼',
    title: 'THEN CAME SHIVAY',
    subtitle: 'Maasi Wala Chapter',
    content: [
      'Aur phir ek din — Shivay aaya.',
      'Technically tumhara beta. Technically mera bhaanja. Technically sab kuch.',
      'But dil mein? Dil mein kuch alag hi tha. Ek naya rishta. Maasi.',
      'Jo feeling us chhote se chehere ko dekhke hui — woh words mein nahi aati.',
      'Aur woh "special" surprise jo har baar god mein lete hi milta tha? 💀 Woh bhi ek yaad ban gayi.',
      'Hum sab bahut jaldi bade ho gaye, Didi. Bahut jaldi.',
    ],
    photos: ['memory-06.jpg', 'memory-07.jpg'],
  },
  {
    id: 'unsaid',
    emoji: '❤️',
    title: 'THINGS WE DON\'T SAY',
    subtitle: 'The Final Letter',
    isLetter: true,
  },
]

// ---- Photo component with graceful fallback ----
function MemoryPhoto({ filename, caption }) {
  const [error, setError] = useState(false)
  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      maxWidth: '320px',
      margin: '0 auto',
    }}>
      {!error ? (
        <img
          src={`/photos/${filename}`}
          alt={caption || ''}
          onError={() => setError(true)}
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '32px', opacity: 0.4 }}>📷</span>
          <span style={{ fontSize: '12px', color: 'rgba(200,215,255,0.3)' }}>Photo</span>
        </div>
      )}
      {caption && (
        <div style={{ padding: '10px', fontSize: '12px', color: 'rgba(200,215,255,0.5)', textAlign: 'center', fontStyle: 'italic' }}>
          {caption}
        </div>
      )}
    </div>
  )
}

// ---- Story Chapter ----
function StoryChapter({ chapter, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: 0.1 }}
      style={{
        marginBottom: 'clamp(60px, 12vw, 100px)',
        maxWidth: '680px',
        margin: '0 auto clamp(60px, 12vw, 100px)',
      }}
    >
      {/* Chapter marker */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontSize: '32px' }}>{chapter.emoji}</span>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(200,215,255,0.4)', textTransform: 'uppercase' }}>
            {String(index + 1).padStart(2, '0')}
          </div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
            background: 'linear-gradient(135deg, #f0d06a, #e8a0b0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1.2,
          }}>
            {chapter.title}
          </h2>
          <div style={{ fontSize: '13px', color: 'rgba(200,215,255,0.5)', marginTop: '2px' }}>
            {chapter.subtitle}
          </div>
        </div>
      </div>

      {/* Content paragraphs */}
      {chapter.content?.map((para, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.08 }}
          style={{
            color: 'rgba(200,215,255,0.8)',
            lineHeight: 1.9,
            fontSize: 'clamp(0.92rem, 2.5vw, 1.05rem)',
            marginBottom: '16px',
          }}
        >
          {para}
        </motion.p>
      ))}

      {/* Photos */}
      {chapter.photos && chapter.photos.length > 0 && (
        <div style={{
          display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center',
          marginTop: '28px',
        }}>
          {chapter.photos.map(photo => (
            <MemoryPhoto key={photo} filename={photo} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ---- Final Letter ----
function FinalLetter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{
        maxWidth: '660px',
        margin: '0 auto',
        padding: 'clamp(28px, 6vw, 48px)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(240,208,106,0.15)',
        borderRadius: '24px',
        position: 'relative',
      }}
    >
      {/* Letter header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>❤️</div>
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(1.4rem, 4vw, 2rem)',
          background: 'linear-gradient(135deg, #f0d06a, #e8a0b0)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          THINGS WE DON'T SAY
        </h2>
        <div style={{ fontSize: '13px', color: 'rgba(200,215,255,0.4)', marginTop: '8px', letterSpacing: '1px' }}>
          — A letter from Sudha to Pooja
        </div>
      </div>

      {[
        { delay: 0.1, text: 'Didi,' },
        { delay: 0.2, text: 'Tu sirf kisi ki wife nahi hai. Sirf kisi ki mummy nahi hai.\n\nTu mere liye abhi bhi wahi Didi hai — jo kabhi kabhi bahut zyada daantti hai, jo Mummy ko sab kuch bata deti hai jab gusse mein hoti hai, aur jo phir bhi sabse pehle side mein khadi hoti hai jab zarurat hoti hai.' },
        { delay: 0.3, text: 'Main "I love you" zyada nahi kehti. Hum dono hi nahi kehte. Lekin jo cheez kahi nahi jaati, woh aaj likhna chahti hoon.' },
        { delay: 0.4, text: 'Hum ek hi kamre mein the. Ek hi almirah. Ek hi makeup. Ek hi bed. Aur phir ek din — vidai ho gayi. Woh kamra khaali lag raha tha. Woh almirah sunni thi. Lagta tha jaise koi cheez hai jo fill nahi hogi kabhi.' },
        { delay: 0.45, text: 'Phir Shivay aaya. Technically tera beta, technically mera nahi. Lekin dil mein? He will always be my first baby. Maasi hona ek alag hi cheez hai — ek rishta jo define nahi hota asaani se, lekin feel hota hai har waqt. Uske saath woh pehla "surprise" bhi — jo har baar god mein lete milta tha — woh bhi ek nayab yaad ban gayi. 😂' },
        { delay: 0.5, text: 'Aur woh college wala waqt — jab tune mujhe daanta, jab mujhe laga "Didi bhi mere against hai" — ab samajh aata hai ki teri daant ke peeche kya tha. Pyar tha. Concern tha. Isliye kyunki tu chahti thi ki main behtar karoon. Yeh tab samajh nahi aaya. Ab aata hai.' },
        { delay: 0.55, text: 'Abhi lagta hai jaise kal hi teri cycle ke peeche school jaati thi. Pata hi nahi chala kab hum itne bade ho gaye. Kab teri shadi ho gayi, kab tu mummy ban gayi, kab mujhe apni Maasi wali identity mili.' },
        { delay: 0.6, text: 'Lekin yeh sab hote hote ek cheez nahi badli —\n\nTu meri Didi hai. Real wali.' },
        { delay: 0.65, text: 'Jo daantti hai, rokti hai, samjhati hai. Aur jab zarurat ho — chup-chaap side mein khadi rehti hai.' },
        { delay: 0.7, text: 'Main zyada express nahi karti. Tu jaanti hai yeh. Lekin aaj janna chahti thi tu ki —\n\nTujhe dekhke bahut khushi hoti hai.\nTera sath bahut miss hota hai.\nAur Mummy ke baad — tujhe hi pehle call karti hoon jab kuch mushkil hota hai.' },
        { delay: 0.75, text: '(Aur haan — yeh bhi pata hai ki tune Mummy ko meri bahut saari cheezein bataai hain. Woh case alag hai. 😂)' },
        { delay: 0.8, text: 'Happy 26th Birthday, Didi.' },
        { delay: 0.85, text: '"Apni real Didi, apni hoti hai."' },
      ].map(({ delay, text }, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay, duration: 0.5 }}
          style={{
            color: text === 'Didi,' ? 'rgba(248,249,255,0.9)' :
              text.startsWith('"') ? '#f0d06a' :
              text.includes('Happy 26th') ? '#e8a0b0' :
              text.includes('real Didi') ? '#f0d06a' :
              text.startsWith('(') ? 'rgba(200,215,255,0.45)' :
              'rgba(200,215,255,0.8)',
            lineHeight: 1.9,
            fontSize: text === 'Didi,' ? '1.1rem' :
              text.includes('Happy 26th') || text.startsWith('"') ? '1.05rem' : 'clamp(0.92rem, 2.5vw, 1rem)',
            marginBottom: '20px',
            fontFamily: text === 'Didi,' || text.includes('Happy 26th') || text.startsWith('"')
              ? 'Playfair Display, serif' : 'inherit',
            fontWeight: text.includes('Happy 26th') || text.startsWith('"') ? 600 : 400,
            fontStyle: text.startsWith('(') ? 'italic' : 'normal',
            whiteSpace: 'pre-line',
          }}
        >
          {text}
        </motion.p>
      ))}

      {/* Signature */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9 }}
        style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(200,215,255,0.5)',
          fontSize: '15px',
          fontStyle: 'italic',
          lineHeight: 1.7,
        }}
      >
        — Tumhari sabse chhoti,<br />
        <span style={{ color: '#e8a0b0' }}>Sudha Goma Chudail ❤️</span>
      </motion.div>
    </motion.div>
  )
}

// ---- Main Birthday World ----
export default function BirthdayWorld() {
  const navigate = useNavigate()
  const { burst, slowCelebration } = useConfetti()
  const [phase, setPhase] = useState('transition') // transition | reveal | world
  const [msgIndex, setMsgIndex] = useState(0)
  const [gameState, setGameState] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    // Check if actually unlocked
    if (api.hasSession()) {
      api.getGameState().then(state => {
        setGameState(state)
        if (!state.final_unlocked) {
          navigate('/game')
        }
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    // Cinematic transition sequence
    const t1 = setTimeout(() => setMsgIndex(1), 2500)
    const t2 = setTimeout(() => {
      burst()
      setPhase('reveal')
    }, 5000)
    const t3 = setTimeout(() => {
      setPhase('world')
      slowCelebration()
    }, 7000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  // ---------- TRANSITION ----------
  if (phase === 'transition') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#050b1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '24px',
        zIndex: 1000,
      }}>
        <StarField count={200} />

        {/* Subtle stars particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'fixed',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '2px', height: '2px',
            borderRadius: '50%',
            background: '#f0d06a',
            opacity: 0.4,
            animation: `twinkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }} />
        ))}

        <AnimatePresence mode="wait">
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.9 }}
            style={{
              position: 'relative', zIndex: 1,
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(1.8rem, 7vw, 3.5rem)',
              color: msgIndex === 1 ? '#f0d06a' : 'rgba(200,215,255,0.75)',
              textAlign: 'center',
              textShadow: msgIndex === 1 ? '0 0 40px rgba(240,208,106,0.4)' : 'none',
              padding: '0 24px',
            }}
          >
            {transitionMessages[msgIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ---------- REVEAL ----------
  if (phase === 'reveal') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(99,16,60,0.6) 0%, rgba(5,11,26,1) 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}>
        <StarField count={250} />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 15 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ fontSize: '80px', marginBottom: '20px', display: 'block' }}
          >
            🎂
          </motion.div>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2rem, 8vw, 4.5rem)',
            background: 'linear-gradient(135deg, #f0d06a, #e8a0b0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1.1,
          }}>
            HAPPY 26TH BIRTHDAY
          </div>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2.5rem, 10vw, 6rem)',
            color: '#f8f9ff',
            marginTop: '8px',
            textShadow: '0 0 40px rgba(240,150,180,0.4)',
          }}>
            DIDI ❤️
          </div>
        </motion.div>
      </div>
    )
  }

  // ---------- BIRTHDAY WORLD ----------
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <StarField count={120} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,16,60,0.5) 0%, rgba(5,11,26,1) 55%)',
        pointerEvents: 'none',
      }} />

      {/* Audio */}
      <audio ref={audioRef} loop style={{ display: 'none' }}>
        <source src="/audio/memory wall.mp3" type="audio/mpeg" />
      </audio>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', padding: 'clamp(40px, 8vw, 80px) 20px', textAlign: 'center' }}>

        {/* Hero */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
          style={{ fontSize: '72px', marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}
        >
          🌸
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2rem, 7vw, 3.5rem)',
            background: 'linear-gradient(135deg, #f0d06a, #e8a0b0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '8px', lineHeight: 1.2,
          }}
        >
          Happy 26th Birthday, Didi.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ color: 'rgba(200,215,255,0.6)', fontSize: '16px', marginBottom: '60px', fontStyle: 'italic' }}
        >
          6 October 2026 ❤️
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: 'clamp(20px, 4vw, 40px)', marginBottom: '80px',
          }}
        >
          {[
            { value: '26', label: 'Saal' },
            { value: '∞', label: 'Fights' },
            { value: '1', label: 'Shivay ❤️' },
            { value: '∞', label: 'Yaadein' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.12, type: 'spring' }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 'clamp(2.2rem, 7vw, 4rem)',
                background: 'linear-gradient(135deg, #f0d06a, #e8a0b0)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                fontWeight: 700, lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ color: 'rgba(200,215,255,0.55)', fontSize: '13px', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Story chapters divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            marginBottom: '60px',
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: '11px', letterSpacing: '3px', color: 'rgba(200,215,255,0.35)', textTransform: 'uppercase' }}>
            Humari Kahani
          </div>
        </motion.div>

        {/* Story chapters */}
        {storyChapters.map((chapter, i) => (
          chapter.isLetter ? (
            <FinalLetter key={chapter.id} />
          ) : (
            <StoryChapter key={chapter.id} chapter={chapter} index={i} />
          )
        ))}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: '80px',
            display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
          }}
        >
          <button onClick={() => navigate('/wall')} className="btn btn-ghost">
            📸 Memory Wall
          </button>
          <button onClick={() => navigate('/story')} className="btn btn-ghost">
            📖 Humari Kahani
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            marginTop: '80px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(200,215,255,0.2)',
            fontSize: '13px',
          }}
        >
          Banaya gaya Sudha ne 🤍 Pooja Didi ke 26th Birthday ke liye
        </motion.div>

      </main>
    </div>
  )
}
