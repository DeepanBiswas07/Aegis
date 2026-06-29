import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Organization from './pages/Organization';
import AcceptInvite from './pages/AcceptInvite';
import ProjectDashboard from './pages/ProjectDashboard';
import MemberLogin from './pages/MemberLogin';
import MemberDashboard from './pages/MemberDashboard';

export default function App() {
  return (
    <BrowserRouter>

      <Routes>
        {/* Organization routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/organization" element={<Organization />} />
        <Route path="/organization/project/:id" element={<ProjectDashboard />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />

        {/* Member routes */}
        <Route path="/member/login" element={<MemberLogin />} />
        <Route path="/member" element={<MemberDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
