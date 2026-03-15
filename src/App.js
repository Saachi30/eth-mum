import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProducerDashboard from './pages/producer/Dashboard';
import ConsumerDashboard from './pages/user/Dashboard';
import ProducerProfile from './pages/producer/ProducerProfile';
import ConsumerProfile from './pages/user/ConsumerProfile';
import Community from './components/Community';
import ChatComponent from './components/chat';
import EventPage from './components/Event';
import ShoppingTracker from './components/ShoppingTracker';
import FloatingChatButton from './components/FloatingChatButton';
import Header from './components/Header';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { account, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      <BrowserRouter>
        <Header />
        <div className="pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes based on Role */}
            <Route 
              path="/producer/dashboard" 
              element={<ProducerDashboard />} 
            />
            <Route 
              path="/producer/profile" 
              element={<ProducerProfile />} 
            />
            
            <Route 
              path="/consumer/dashboard" 
              element={<ConsumerDashboard />} 
            />
            <Route 
              path="/consumer/profile" 
              element={<ConsumerProfile />} 
            />

            <Route path="/community" element={<Community />} />
            <Route path="/chat/:userId" element={<ChatComponent />} />
            <Route path="/events" element={<EventPage />} />
            <Route path="/shop" element={<ShoppingTracker />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <FloatingChatButton />
      </BrowserRouter>
    </div>
  );
};

export default App;
