import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmergencyAlertProps {
  onCallEmergency: () => void;
  onContinue: () => void;
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({
  onCallEmergency,
  onContinue,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Emergency Banner */}
      <motion.div
        className="emergency-gradient rounded-2xl p-6 mb-6 shadow-emergency"
        animate={{ opacity: [1, 0.85, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertTriangle className="h-10 w-10 text-destructive-foreground" />
          <h2 className="text-2xl md:text-3xl font-bold text-destructive-foreground">
            EMERGENCY DETECTED
          </h2>
        </div>
        <p className="text-center text-destructive-foreground/90 text-lg">
          Based on your symptoms, immediate medical attention may be required.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button
          variant="emergency"
          size="xl"
          className="w-full text-lg"
          onClick={onCallEmergency}
        >
          <Phone className="h-6 w-6" />
          Call Emergency Services
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={onContinue}
        >
          <ArrowRight className="h-5 w-5" />
          Continue with Instructions
        </Button>
      </div>

      {/* Reassurance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-card rounded-xl border border-border flex items-center gap-3"
      >
        <Heart className="h-8 w-8 text-destructive flex-shrink-0" />
        <p className="text-lg text-foreground font-medium">
          I am here with you. Stay calm. Help is on the way.
        </p>
      </motion.div>
    </motion.div>
  );
};
