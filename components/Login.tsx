import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simuler une vérification asynchrone
    setTimeout(() => {
      if (username === 'Fracht' && password === '123456@') {
        setIsLoading(false);
        onLogin();
      } else {
        setIsLoading(false);
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fracht-blue via-fracht-blue-light to-fracht-blue-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <img 
            src="https://www.frachtgroup.com/themes/custom/fracht/images/frachtlogowhite.png" 
            alt="Fracht"
            className="h-10 w-auto mx-auto mb-6"
            style={{ filter: 'brightness(0) saturate(100%) invert(9%) sepia(47%) saturate(2000%) hue-rotate(180deg) brightness(95%) contrast(95%)' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/50 focus:border-fracht-blue transition-all"
            placeholder="Utilisateur"
            required
            autoFocus
          />

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/50 focus:border-fracht-blue transition-all"
            placeholder="Mot de passe"
            required
          />

          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-fracht-blue text-white py-3 rounded-lg font-medium hover:bg-fracht-blue-light transition-all disabled:opacity-50"
          >
            {isLoading ? '...' : 'Connexion'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
