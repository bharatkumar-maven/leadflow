import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Tasks from './pages/Tasks';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login"/>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/"/> : <Login/>}/>
      <Route path="/" element={<PrivateRoute><Layout/></PrivateRoute>}>
        <Route index element={<Dashboard/>}/>
        <Route path="leads" element={<Leads/>}/>
        <Route path="leads/:id" element={<LeadDetail/>}/>
        <Route path="tasks" element={<Tasks/>}/>
        <Route path="campaigns" element={<Campaigns/>}/>
        <Route path="settings" element={<Settings/>}/>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }}/>
      </BrowserRouter>
    </AuthProvider>
  );
}
