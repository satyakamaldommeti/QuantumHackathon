import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Shield, Heart, Phone, User, LogOut, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MicrophoneButton } from '@/components/MicrophoneButton';
import { VoiceWave } from '@/components/VoiceWave';
import { AIQuestion } from '@/components/AIQuestion';
import { EmergencyAlert } from '@/components/EmergencyAlert';
import { InstructionCard } from '@/components/InstructionCard';
import { AuthScreen } from '@/components/AuthScreen';
import { ChatInterface } from '@/components/ChatInterface';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AppScreen = 'landing' | 'listening' | 'question' | 'emergency' | 'instructions' | 'auth' | 'chat';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('landing');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('landing');
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, isSpeaking } = useTextToSpeech();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Mock data for demonstration
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "Is the pain severe, medium, or mild?",
    options: [
      { label: "Mild - Uncomfortable but manageable", value: "mild" },
      { label: "Medium - Significant discomfort", value: "medium" },
      { label: "Severe - Intense, unbearable pain", value: "severe" },
    ],
  });

  const [instructionSteps, setInstructionSteps] = useState([
    { step: 1, instruction: "Stay calm and assess the situation around you.", completed: false },
    { step: 2, instruction: "Apply firm pressure to the wound with a clean cloth.", completed: false },
    { step: 3, instruction: "Keep the injured area elevated above heart level.", completed: false },
    { step: 4, instruction: "Monitor for signs of shock: pale skin, rapid breathing.", completed: false },
  ]);
  const [currentStep, setCurrentStep] = useState(1);

  // Handle voice input completion
  useEffect(() => {
    if (transcript && !isListening && currentScreen === 'listening') {
      // Process the voice input
      processVoiceInput(transcript);
    }
  }, [transcript, isListening]);

  const processVoiceInput = (input: string) => {
    const lowerInput = input.toLowerCase();

    // Check for emergency keywords
    if (lowerInput.includes('heart') || lowerInput.includes('chest pain') || lowerInput.includes('can\'t breathe') || lowerInput.includes('unconscious')) {
      setCurrentScreen('emergency');
      speak("Emergency detected. Please stay calm. I'm here with you.");
    } else {
      // Show follow-up question
      setCurrentScreen('question');
      speak(currentQuestion.question);
    }

    resetTranscript();
  };

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setCurrentScreen('listening');
      startListening();
    }
  };

  const handleQuickReply = (value: string) => {
    if (value === 'severe') {
      setCurrentScreen('emergency');
      speak("Based on the severity of your symptoms, I recommend seeking immediate medical attention.");
    } else {
      setCurrentScreen('instructions');
      speak(instructionSteps[0].instruction);
    }
  };

  const handleEmergencyCall = () => {
    window.location.href = 'tel:911';
  };

  const handleContinueInstructions = () => {
    setCurrentScreen('instructions');
    speak(instructionSteps[0].instruction);
  };

  const handleRepeatInstruction = (step: number) => {
    const instruction = instructionSteps.find(s => s.step === step);
    if (instruction) {
      speak(instruction.instruction);
    }
  };

  const handleCompleteStep = (step: number) => {
    setInstructionSteps(prev =>
      prev.map(s => (s.step === step ? { ...s, completed: true } : s))
    );

    if (step < instructionSteps.length) {
      setCurrentStep(step + 1);
      speak(instructionSteps[step].instruction);
    } else {
      toast({
        title: "All steps completed!",
        description: "Great job following the first-aid instructions.",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  const handleGoToChat = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('chat');
  };

  const handleBackFromChat = () => {
    setCurrentScreen(previousScreen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onBack={() => setCurrentScreen('landing')} />;

      case 'listening':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-4"
          >
            <div className="text-center mb-8">
              <VoiceWave isActive={isListening} />
              <p className="text-2xl font-semibold text-foreground mt-6">
                {isListening ? 'Listening...' : 'Processing...'}
              </p>
              <p className="text-muted-foreground mt-2">
                Describe your emergency or symptoms
              </p>
              {transcript && (
                <p className="mt-4 text-lg text-primary italic">"{transcript}"</p>
              )}
            </div>

            <Button
              variant="destructive"
              size="xl"
              onClick={() => {
                stopListening();
                setCurrentScreen('landing');
              }}
            >
              Cancel
            </Button>
          </motion.div>
        );

      case 'question':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-4"
          >
            <AIQuestion
              question={currentQuestion.question}
              options={currentQuestion.options}
              isListening={isListening}
              onStartListening={startListening}
              onStopListening={stopListening}
              onQuickReply={handleQuickReply}
              transcript={transcript}
            />
          </motion.div>
        );

      case 'emergency':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-4"
          >
            <EmergencyAlert
              onCallEmergency={handleEmergencyCall}
              onContinue={handleContinueInstructions}
            />
          </motion.div>
        );

      case 'instructions':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-start min-h-[60vh] px-4 py-8"
          >
            <InstructionCard
              steps={instructionSteps}
              currentStep={currentStep}
              onRepeat={handleRepeatInstruction}
              onComplete={handleCompleteStep}
              isSpeaking={isSpeaking}
            />

            <Button
              variant="outline"
              size="lg"
              className="mt-8"
              onClick={() => setCurrentScreen('landing')}
            >
              Back to Home
            </Button>
          </motion.div>
        );

      case 'chat':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[calc(100vh-4rem)]"
          >
            <ChatInterface onEmergencyDetected={() => setCurrentScreen('emergency')} />
            <div className="absolute top-4 left-4">
              <Button variant="ghost" size="sm" onClick={handleBackFromChat}>
                ← Back
              </Button>
            </div>
          </motion.div>
        );

      default: // landing
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8"
          >
            {/* Hero Section */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 rounded-full primary-gradient mx-auto flex items-center justify-center mb-8 shadow-glow animate-breathing"
              >
                <Shield className="h-12 w-12 text-primary-foreground" />
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 tracking-tight">
                Voice First-Aid AI
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-lg mx-auto font-medium">
                Emergency assistance at your voice command
              </p>
            </div>

            {/* Microphone Button */}
            <motion.div
              className="mb-6"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MicrophoneButton
                isListening={isListening}
                onClick={handleMicrophoneClick}
                disabled={!isSupported}
              />
            </motion.div>

            <p className="text-xl text-foreground font-bold mb-10 text-center tracking-wide">
              Tap & Speak Your Emergency
            </p>

            {/* Chat Option */}
            <Button
              variant="secondary"
              size="lg"
              className="mb-8 font-semibold"
              onClick={handleGoToChat}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Or Chat with Text
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 max-w-md w-full mt-4">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border">
                <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mb-3">
                  <Heart className="h-7 w-7 text-success" />
                </div>
                <span className="text-sm font-medium text-foreground">First-Aid</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <Mic className="h-7 w-7 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Voice Input</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border">
                <div className="w-14 h-14 rounded-full bg-emergency/20 flex items-center justify-center mb-3">
                  <Phone className="h-7 w-7 text-emergency" />
                </div>
                <span className="text-sm font-medium text-foreground">Emergency</span>
              </div>
            </div>

            {/* Not Supported Warning */}
            {!isSupported && (
              <div className="mt-8 p-4 bg-warning/10 border-2 border-warning rounded-xl text-center">
                <p className="text-foreground font-medium text-sm">
                  Voice input is not supported in this browser. Please use Chrome or Edge.
                </p>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:block">
              Voice First-Aid AI
            </span>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setCurrentScreen('auth')}>
                <img src="/profile-logo.png" alt="Profile" className="h-4 w-4 mr-2 object-contain" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>

      {/* Emergency FAB */}
      {currentScreen !== 'emergency' && currentScreen !== 'auth' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            variant="emergency"
            size="iconLg"
            onClick={handleEmergencyCall}
            aria-label="Call Emergency Services"
          >
            <Phone className="h-7 w-7" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Index;
