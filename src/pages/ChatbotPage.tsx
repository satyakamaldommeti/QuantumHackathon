import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Shield, Heart, Phone, User, LogOut, MessageCircle, Plus } from 'lucide-react';
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
import Footer from '@/components/layout/Footer';

type AppScreen = 'landing' | 'listening' | 'question' | 'emergency' | 'instructions' | 'auth' | 'chat';

const ChatbotPage = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('chat');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('chat');
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { speak, isSpeaking } = useTextToSpeech();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [chatKey, setChatKey] = useState(0);

  const handleNewChat = () => {
    setChatKey(prev => prev + 1);
    setCurrentScreen('chat');
    // Set a flag with timestamp to indicate new chat was just requested
    sessionStorage.setItem('newChatRequested', Date.now().toString());
    // Clear conversationId from URL without reloading
    const newUrl = window.location.pathname;
    window.history.pushState({}, '', newUrl);
    // Clear session storage
    sessionStorage.removeItem('activeConversationId');
  };

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

  // Automatically start new chat when user changes (login/logout)
  useEffect(() => {
    handleNewChat();
  }, [user?.uid]);

  useEffect(() => {
    if (transcript && !isListening && currentScreen === 'listening') {
      processVoiceInput(transcript);
    }
  }, [transcript, isListening]);

  const processVoiceInput = (input: string) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('heart') || lowerInput.includes('chest pain') || lowerInput.includes('can\'t breathe') || lowerInput.includes('unconscious')) {
      setCurrentScreen('emergency');
      speak("Emergency detected. Please stay calm. I'm here with you.");
    } else {
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
    handleNewChat(); // Force reset immediately
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onBack={() => setCurrentScreen('chat')} />;

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
              size="lg"
              onClick={() => {
                stopListening();
                setCurrentScreen('chat');
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
              onClick={() => setCurrentScreen('chat')}
            >
              Back to Chat
            </Button>
          </motion.div>
        );

      default: // chat
        return (
          <div className="h-full">
            <ChatInterface key={chatKey} onEmergencyDetected={() => setCurrentScreen('emergency')} />
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 ml-12 lg:ml-0">
          <img
            src="/care-shield-chat-logo.png"
            alt="Care Shield Chat"
            className="w-9 h-9 object-contain"
          />
          <div>
            <h1 className="font-semibold text-foreground">AI Chatbot</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Voice & Text Support</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="mr-1 hidden sm:flex border-primary/20 hover:border-primary hover:bg-primary/5 text-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="icon" onClick={handleNewChat} className="sm:hidden mr-1 text-primary">
              <Plus className="h-5 w-5" />
            </Button>
          )}

          {user ? (
            <>
              {/* User Avatar Circle */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary uppercase">
                    {user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 px-3 text-xs bg-red-950/80 hover:bg-red-950"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setCurrentScreen('auth')}>
              <img src="/profile-logo.png" alt="Profile" className="h-4 w-4 mr-2 object-contain" />
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default ChatbotPage;
