import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import PlayersList from './pages/Players/PlayersList';
import PlayerDetail from './pages/Players/PlayerDetail';
import MatchesList from './pages/Matches/MatchesList';
import MatchDetail from './pages/Matches/MatchDetail';
import LiveMatch from './pages/Matches/LiveMatch';
import TrainingList from './pages/Training/TrainingList';
import TrainingDetail from './pages/Training/TrainingDetail';
import AnalysisDashboard from './pages/Analysis/AnalysisDashboard';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="teams" element={<Teams />} />
          <Route path="players" element={<PlayersList />} />
          <Route path="players/:id" element={<PlayerDetail />} />
          <Route path="matches" element={<MatchesList />} />
          <Route path="matches/:id" element={<MatchDetail />} />
          <Route path="training" element={<TrainingList />} />
          <Route path="training/:id" element={<TrainingDetail />} />
          <Route path="analysis" element={<AnalysisDashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        {/* Live match has its own full-screen layout */}
        <Route path="/matches/:id/live" element={<LiveMatch />} />
      </Routes>
    </BrowserRouter>
  );
}
