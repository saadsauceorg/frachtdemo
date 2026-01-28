import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('Salma.ELkasri@ma.fracht.africa');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Connexion directe sans vérification
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 300);
  };


  return (
    <div className="min-h-screen bg-fracht-blue flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-white rounded-lg shadow-xl p-6"
      >
        <div className="text-center mb-6">
          <img 
            src="https://www.frachtgroup.com/themes/custom/fracht/images/frachtlogowhite.png" 
            alt="Fracht"
            className="h-8 w-auto mx-auto mb-4"
            style={{ filter: 'brightness(0) saturate(100%) invert(9%) sepia(47%) saturate(2000%) hue-rotate(180deg) brightness(95%) contrast(95%)' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/50 focus:border-fracht-blue transition-all"
            placeholder="Email"
            required
            autoFocus
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-fracht-blue text-white py-2.5 rounded-lg font-medium hover:bg-fracht-blue-light transition-all disabled:opacity-50 text-sm"
          >
            {isLoading ? '...' : 'Accéder'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
