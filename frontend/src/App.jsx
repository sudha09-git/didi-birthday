import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StartScreen from './pages/StartScreen.jsx'
import GameScreen from './pages/GameScreen.jsx'
import OurStory from './pages/OurStory.jsx'
import PhotoWall from './pages/PhotoWall.jsx'
import GiftsPage from './pages/GiftsPage.jsx'
import BirthdayWorld from './pages/BirthdayWorld.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/story" element={<OurStory />} />
        <Route path="/wall" element={<PhotoWall />} />
        <Route path="/gifts" element={<GiftsPage />} />
        <Route path="/birthday" element={<BirthdayWorld />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
