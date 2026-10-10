import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RecommendationsPage from './pages/recommendations/RecommendationsPage'
import HomePage from './pages/home/HomePage'
import ConsultationPage from './pages/consultation/ConsultationPage'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/recommendations" element={<RecommendationsPage />} />
    <Route path="/consultation" element={<ConsultationPage />} />
  </Routes></BrowserRouter>

}
