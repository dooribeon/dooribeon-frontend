import { useState } from 'react'
import NeighborhoodDetailPage from './pages/recommendations/NeighborhoodDetailPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RecommendationsPage from './pages/recommendations/RecommendationsPage'
import HomePage from './pages/home/HomePage'
import ConsultationPage from './pages/consultation/ConsultationPage'

export default function App() {
  const [saved, setSaved] = useState<string[]>([])
  function toggleSaved(id: string) {
    setSaved(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  }
  return <BrowserRouter><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/recommendations" element={<RecommendationsPage saved={saved} onToggleSaved={toggleSaved} />} />
    <Route path="/recommendations/:id" element={<NeighborhoodDetailPage saved={saved} onToggleSaved={toggleSaved} />} />
    <Route path="/consultation" element={<ConsultationPage />} />
  </Routes></BrowserRouter>

}
