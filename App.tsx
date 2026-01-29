import React, { useState } from 'react';
import { FrachtConsole } from './components/FrachtConsole';
import { Login } from './components/Login';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  // Vérifier immédiatement le localStorage de manière synchrone
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fracht_authenticated') === 'true';
    }
    return false;
  });

  const handleLogin = (email: string) => {
    localStorage.setItem('fracht_authenticated', 'true');
    localStorage.setItem('fracht_user_email', email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fracht_authenticated');
    localStorage.removeItem('fracht_user_email');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  const userEmail = typeof window !== 'undefined' 
    ? localStorage.getItem('fracht_user_email') || 'Salma.ELkasri@ma.fracht.africa'
    : 'Salma.ELkasri@ma.fracht.africa';

  return <FrachtConsole onLogout={handleLogout} userEmail={userEmail} />;
};

export default App;
