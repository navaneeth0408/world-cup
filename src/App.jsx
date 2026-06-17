import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Predictions from './pages/Predictions'
import Standings from './pages/Standings'
import Simulator from './pages/Simulator'
import HistoricalSimulator from './pages/HistoricalSimulator'
import HistoricalSquads from './pages/HistoricalSquads'
import MatchDetail from './pages/MatchDetail'
import Matches from './pages/Matches'
import Admin from './pages/Admin'
import PlayerArticle from './pages/PlayerArticle'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/simulator/historical" element={<HistoricalSimulator />} />
        <Route path="/simulator/historical/squads" element={<HistoricalSquads />} />
        <Route path="/match/:id" element={<MatchDetail />} />
        <Route path="/player/:id" element={<PlayerArticle />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}