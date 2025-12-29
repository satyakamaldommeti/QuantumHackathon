import React from 'react';
import { motion } from 'framer-motion';
import { Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceWave } from './VoiceWave';

interface QuickReplyOption {
  label: string;
  value: string;
}

interface AIQuestionProps {
  question: string;
  options?: QuickReplyOption[];
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onQuickReply: (value: string) => void;
  transcript?: string;
}

export const AIQuestion: React.FC<AIQuestionProps> = ({
  question,
  options = [],
  isListening,
  onStartListening,
  onStopListening,
  onQuickReply,
  transcript = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Question Card */}
      <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-lg mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full primary-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏥</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">AI First-Aid Assistant</p>
            <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">
              {question}
            </p>
          </div>
        </div>

        {/* Voice Wave when listening */}
        {isListening && (
          <div className="mb-4">
            <VoiceWave isActive={isListening} />
            {transcript && (
              <p className="text-center text-lg text-muted-foreground mt-2 italic">
                "{transcript}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Voice Reply Button */}
      <div className="flex justify-center mb-6">
        {isListening ? (
          <Button
            variant="destructive"
            size="iconXl"
            onClick={onStopListening}
            aria-label="Stop listening"
          >
            <X className="h-8 w-8" />
          </Button>
        ) : (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="voice"
              size="iconXl"
              onClick={onStartListening}
              aria-label="Speak your answer"
            >
              <Mic className="h-8 w-8" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Quick Reply Options */}
      {options.length > 0 && !isListening && (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Or tap to select:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {options.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="quickReply"
                  size="lg"
                  className="w-full text-lg"
                  onClick={() => onQuickReply(option.value)}
                >
                  {option.label}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
