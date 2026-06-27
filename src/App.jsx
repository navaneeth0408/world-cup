import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import TeamStats from './pages/TeamStats'
import Predictions from './pages/Predictions'
import Standings from './pages/Standings'
import Simulator from './pages/Simulator'
import HistoricalSimulator from './pages/HistoricalSimulator'
import HistoricalSquads from './pages/HistoricalSquads'
import MatchDetail from './pages/MatchDetail'
import Matches from './pages/Matches'
import Admin from './pages/Admin'
import PlayerArticle from './pages/PlayerArticle'

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
        <Route path="/teams/:id/stats" element={<TeamStats />} />
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