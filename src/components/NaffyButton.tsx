'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';

interface NaffyButtonProps {
  naffyLink: string;
  text?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function NaffyButton({ 
  naffyLink, 
  text = 'Kup Dostęp', 
  variant = 'primary', 
  className = '' 
}: NaffyButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <motion.a
      href={naffyLink}
      // target="_blank" // Odkomentuj, jeśli chcesz, żeby płatność otwierała się w nowej karcie
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative overflow-hidden flex items-center justify-center gap-3 w-full py-5 rounded-full transition-all duration-300 font-extrabold text-center group block
        ${isPrimary 
          ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)]' 
          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold'
        }
        ${className}
      `}
    >
      {/* Delikatny błysk (sweep) na hoverze dla wariantu głównego */}
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
      )}
      
      <span>{text}</span>
      
      {/* Animowana strzałeczka / ikona */}
      <CreditCard className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isPrimary ? 'text-black' : 'text-purple-400'}`} />
    </motion.a>
  );
}
