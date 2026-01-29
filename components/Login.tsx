import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: (email: string) => void;
}

const AUTHORIZED_EMAILS = [
  'Salma.ELkasri@ma.fracht.africa',
  'faycal.rabia@ma.fracht.africa'
];

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('Salma.ELkasri@ma.fracht.africa');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== 'FRACHT@2026') {
      alert('Mot de passe incorrect');
      return;
    }
    if (!AUTHORIZED_EMAILS.includes(email)) {
      alert('Email non autorisé');
      return;
    }
    onLogin(email);
  };

  // Variantes d'animation pour les cercles bleus en arrière-plan
  const circleVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3],
      x: [0, 50, 0],
      y: [0, 30, 0],
    },
  };

  const circleVariants2 = {
    animate: {
      scale: [1, 1.3, 1],
      opacity: [0.2, 0.4, 0.2],
      x: [0, -40, 0],
      y: [0, -50, 0],
    },
  };

  const circleVariants3 = {
    animate: {
      scale: [1, 1.15, 1],
      opacity: [0.25, 0.45, 0.25],
      x: [0, 30, 0],
      y: [0, -40, 0],
    },
  };

  const transition = {
    duration: 8,
    repeat: Infinity,
    ease: "easeInOut",
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0B3C5D 0%, #0E4A6F 50%, #1E5A7F 100%)',
      }}
    >
      {/* Formes abstraites animées en arrière-plan */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #0E4A6F, #1E5A7F)' }}
        variants={circleVariants}
        animate="animate"
        transition={transition}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #1E5A7F, #0E4A6F)' }}
        variants={circleVariants2}
        animate="animate"
        transition={{ ...transition, duration: 10 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-10 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #0E4A6F, #0B3C5D)' }}
        variants={circleVariants3}
        animate="animate"
        transition={{ ...transition, duration: 12 }}
      />

      {/* Conteneur principal divisé en deux sections - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Section supérieure - Header bleu ultra compact */}
        <div 
          className="relative px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, #0B3C5D 0%, #0E4A6F 100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative z-10 flex items-center justify-between"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
              className="flex items-baseline gap-2"
            >
              <h1
                className="text-3xl font-bold text-white tracking-tight leading-tight"
                style={{
                  fontFamily: "'Orbitron', 'Rajdhani', 'Exo 2', sans-serif",
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Abilis
              </h1>
              <span
                className="text-lg font-semibold text-white/90 tracking-wide"
                style={{
                  fontFamily: "'Orbitron', 'Rajdhani', 'Exo 2', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Motion
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex flex-col items-end gap-1"
            >
              <span className="text-[9px] text-white/70 font-medium tracking-wide uppercase">
                Accès accordé à
              </span>
              <img
                src="https://www.frachtgroup.com/themes/custom/fracht/images/frachtlogowhite.png"
                alt="Fracht Group"
                className="h-6 w-auto opacity-90"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Section inférieure - Zone blanche ultra compacte */}
        <div className="bg-white px-5 py-5">
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">
                Email
              </label>
              <div className="relative">
                <motion.select
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/30 transition-all appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #E5E9ED 0%, #D1D8DE 100%)',
                    border: 'none',
                  }}
                  required
                  autoFocus
                >
                  {AUTHORIZED_EMAILS.map((emailOption) => (
                    <option key={emailOption} value={emailOption}>
                      {emailOption}
                    </option>
                  ))}
                </motion.select>
                <div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '6px solid #6B7683',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block">
                Mot de passe
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/30 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #E5E9ED 0%, #D1D8DE 100%)',
                  border: 'none',
                }}
                placeholder="••••••••"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-fracht-blue text-white py-2.5 rounded-full font-semibold hover:bg-fracht-blue-light transition-all shadow-lg shadow-fracht-blue/30 active:scale-[0.98] mt-3 uppercase tracking-wide text-sm"
            >
              Se connecter
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};
