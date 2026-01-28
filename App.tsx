import React, { useState, useEffect } from 'react';
import { FrachtConsole } from './components/FrachtConsole';
import { Login } from './components/Login';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté (session stockée)
  useEffect(() => {
    const authStatus = localStorage.getItem('fracht_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Gérer la connexion
  const handleLogin = () => {
    localStorage.setItem('fracht_authenticated', 'true');
    setIsAuthenticated(true);
  };

  // Si non authentifié, afficher la page de login
  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  // Afficher Fracht Console
  return <FrachtConsole />;
};

export default App;
