import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobCreate from './pages/JobCreate';
import JobDetail from './pages/JobDetail';
import CandidateUpload from './pages/CandidateUpload';
import CandidateProfile from './pages/CandidateProfile';
import Interview from './pages/Interview';
import SearchPage from './pages/Search';
import AuditTrail from './pages/AuditTrail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs/new" element={<JobCreate />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/:jobId/upload" element={<CandidateUpload />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />
            <Route path="/interviews/:jobId/:candidateId" element={<Interview />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/audit" element={<AuditTrail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
