import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OwnerPage from './pages/OwnerPage';
import ArchitectPage from './pages/ArchitectPage';
import MapView from './pages/MapView';
import ResidentsPage from './pages/ResidentsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import PolicyPage from './pages/PolicyPage';

const AuthenticatedApp = () => {
  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/owner" element={<OwnerPage />} />
        <Route path="/architect" element={<ArchitectPage />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/residents" element={<ResidentsPage />} />
        <Route path="/architect/:id" element={<ApplicationDetailPage />} />
        <Route path="/policy" element={<PolicyPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App