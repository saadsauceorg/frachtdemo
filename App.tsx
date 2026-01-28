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

  const handleLogin = () => {
    localStorage.setItem('fracht_authenticated', 'true');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return <FrachtConsole />;
};

export default App;
