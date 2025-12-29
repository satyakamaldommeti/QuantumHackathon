import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MicrophoneButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  onClick,
  disabled = false,
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <motion.div
            className="absolute h-32 w-32 rounded-full bg-primary/20"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute h-32 w-32 rounded-full bg-primary/30"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
          />
          <motion.div
            className="absolute h-32 w-32 rounded-full bg-primary/40"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          />
        </>
      )}

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="voice"
          size="iconHuge"
          onClick={onClick}
          disabled={disabled}
          className={`relative z-10 ${isListening ? 'shadow-glow-lg' : ''}`}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <Mic className={`h-12 w-12 ${isListening ? 'animate-pulse' : ''}`} />
        </Button>
      </motion.div>
    </div>
  );
};
