import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstructionStep {
  step: number;
  instruction: string;
  completed?: boolean;
}

interface InstructionCardProps {
  steps: InstructionStep[];
  currentStep: number;
  onRepeat: (step: number) => void;
  onComplete: (step: number) => void;
  isSpeaking: boolean;
}

export const InstructionCard: React.FC<InstructionCardProps> = ({
  steps,
  currentStep,
  onRepeat,
  onComplete,
  isSpeaking,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
        Follow These Steps
      </h2>

      {steps.map((step, index) => (
        <motion.div
          key={step.step}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-4 md:p-6 rounded-xl border-2 transition-all ${
            currentStep === step.step
              ? 'border-primary bg-primary/5 shadow-glow'
              : step.completed
              ? 'border-success bg-success/5'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Step Number */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                step.completed
                  ? 'bg-success text-success-foreground'
                  : currentStep === step.step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.completed ? <Check className="h-5 w-5" /> : step.step}
            </div>

            {/* Instruction Text */}
            <div className="flex-1">
              <p
                className={`text-lg md:text-xl font-medium leading-relaxed ${
                  currentStep === step.step
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.instruction}
              </p>

              {/* Actions for current step */}
              {currentStep === step.step && (
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRepeat(step.step)}
                    disabled={isSpeaking}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Repeat
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onComplete(step.step)}
                  >
                    <Check className="h-4 w-4" />
                    Done
                  </Button>
                </div>
              )}
            </div>

            {/* Speaking indicator */}
            {currentStep === step.step && isSpeaking && (
              <Volume2 className="h-6 w-6 text-primary animate-pulse flex-shrink-0" />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
