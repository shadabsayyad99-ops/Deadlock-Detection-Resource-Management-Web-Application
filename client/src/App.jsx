import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProcessManagement from './pages/ProcessManagement';
import ResourceManagement from './pages/ResourceManagement';
import ResourceAllocation from './pages/ResourceAllocation';
import DeadlockDetectionPage from './pages/DeadlockDetectionPage';
import BankersAlgorithmPage from './pages/BankersAlgorithmPage';
import ResourceAllocationGraphPage from './pages/ResourceAllocationGraphPage';
import SimulationPage from './pages/SimulationPage';
import RecoveryPage from './pages/RecoveryPage';
import PreventionPage from './pages/PreventionPage';
import ComparisonPage from './pages/ComparisonPage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="processes" element={<ProcessManagement />} />
            <Route path="resources" element={<ResourceManagement />} />
            <Route path="allocation" element={<ResourceAllocation />} />
            <Route path="deadlock-detection" element={<DeadlockDetectionPage />} />
            <Route path="bankers-algorithm" element={<BankersAlgorithmPage />} />
            <Route path="resource-allocation-graph" element={<ResourceAllocationGraphPage />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="recovery" element={<RecoveryPage />} />
            <Route path="prevention" element={<PreventionPage />} />
            <Route path="comparison" element={<ComparisonPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
