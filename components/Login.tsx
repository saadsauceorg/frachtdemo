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
    onLogin();
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
    <div className="min-h-screen bg-fracht-blue flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cercles bleus animés en arrière-plan */}
      <motion.div
        className="absolute top-20 left-20 w-96 h-96 rounded-full bg-fracht-blue-light opacity-30 blur-3xl"
        variants={circleVariants}
        animate="animate"
        transition={transition}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-fracht-blue-accent opacity-25 blur-3xl"
        variants={circleVariants2}
        animate="animate"
        transition={{ ...transition, duration: 10 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-fracht-blue-light opacity-20 blur-3xl"
        variants={circleVariants3}
        animate="animate"
        transition={{ ...transition, duration: 12 }}
      />
      <motion.div
        className="absolute top-40 right-40 w-64 h-64 rounded-full bg-fracht-blue-accent opacity-25 blur-2xl"
        variants={circleVariants}
        animate="animate"
        transition={{ ...transition, duration: 9 }}
      />

      {/* Carte de login avec ombre prononcée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl"
        style={{
          boxShadow: '0 25px 50px -12px rgba(11, 60, 93, 0.4), 0 0 0 1px rgba(11, 60, 93, 0.05)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-10"
        >
          <img 
            src="https://www.frachtgroup.com/themes/custom/fracht/images/frachtlogowhite.png" 
            alt="Fracht"
            className="h-12 w-auto mx-auto mb-8"
            style={{ filter: 'brightness(0) saturate(100%) invert(9%) sepia(47%) saturate(2000%) hue-rotate(180deg) brightness(95%) contrast(95%)' }}
          />
          <h1 className="text-2xl font-bold text-fracht-blue mb-3 tracking-tight">Console Design</h1>
          <p className="text-gray-500 text-sm">Connectez-vous pour accéder à vos projets</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 block">
              Email professionnel
            </label>
            <motion.input
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fracht-blue/30 focus:border-fracht-blue transition-all placeholder-gray-400"
              placeholder="votre@email.com"
              required
              autoFocus
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-fracht-blue text-white py-4 rounded-xl font-semibold hover:bg-fracht-blue-light transition-all shadow-lg shadow-fracht-blue/30 active:scale-[0.98]"
          >
            Accéder à la console
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};
