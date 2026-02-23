import { Route, Switch, Redirect } from 'wouter';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import DashboardV1 from './pages/v1/Dashboard';
import ThisRoundV1 from './pages/v1/ThisRound';
import LeaderboardV1 from './pages/v1/Leaderboard';
import RoundsV1 from './pages/v1/Rounds';
import StatsV1 from './pages/v1/Stats';
import AdminV1 from './pages/v1/Admin';
import AdminRoundV1 from './pages/v1/AdminRound';
import CompareRoundV1 from './pages/v1/CompareRound';
import CompareRoundHistoryV1 from './pages/v1/CompareRoundHistory';
import { Toaster } from '@/components/ui/sonner';

function NotFoundRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-slate-400 mb-4">Sorry, this page doesn't exist.</p>
        <a href="/" className="text-blue-400 hover:underline">Go back home</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        
        {/* Protected Version 1 Routes */}
        <Route path="/version1">
          <ProtectedRoute>
            <DashboardV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/active">
          <ProtectedRoute>
            <ThisRoundV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/leaderboard">
          <ProtectedRoute>
            <LeaderboardV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/rounds">
          <ProtectedRoute>
            <RoundsV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/rounds/:roundNumber/compare">
          <ProtectedRoute>
            <CompareRoundHistoryV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/stats">
          <ProtectedRoute>
            <StatsV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/admin/round/:roundNumber">
          <ProtectedRoute>
            <AdminRoundV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/admin/postponed/:id">
          <ProtectedRoute>
            <AdminRoundV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/admin">
          <ProtectedRoute>
            <AdminV1 />
          </ProtectedRoute>
        </Route>
        <Route path="/version1/compare/:status">
          <ProtectedRoute>
            <CompareRoundV1 />
          </ProtectedRoute>
        </Route>
        
        <Route>
          <NotFoundRoute />
        </Route>
      </Switch>
      <Toaster position="bottom-right" duration={3000} />
    </AuthProvider>
  );
}

export default App;
