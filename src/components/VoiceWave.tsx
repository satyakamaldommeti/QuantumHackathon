import React from 'react';
import { motion } from 'framer-motion';

interface VoiceWaveProps {
  isActive: boolean;
}

export const VoiceWave: React.FC<VoiceWaveProps> = ({ isActive }) => {
  const bars = 5;

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, index) => (
        <motion.div
          key={index}
          className="w-2 rounded-full bg-primary"
          initial={{ height: 8 }}
          animate={
            isActive
              ? {
                  height: [8, 32, 16, 40, 8],
                  transition: {
                    duration: 0.8,
                    repeat: Infinity,
                    delay: index * 0.1,
                    ease: "easeInOut",
                  },
                }
              : { height: 8 }
          }
        />
      ))}
    </div>
  );
};
