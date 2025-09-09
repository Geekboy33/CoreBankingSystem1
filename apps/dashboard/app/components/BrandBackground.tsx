'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function BrandBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: 0.9, scale: 1.05 }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute -top-40 -left-40 h-[50rem] w-[50rem] rounded-full bg-gradient-to-br from-brand/30 via-emerald-500/10 to-cyan-500/20 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{ opacity: 0.6, scale: 1.1 }}
        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute -bottom-40 -right-40 h-[50rem] w-[50rem] rounded-full bg-gradient-to-tr from-brand/20 via-purple-500/10 to-blue-500/20 blur-3xl"
      />
    </div>
  );
}
