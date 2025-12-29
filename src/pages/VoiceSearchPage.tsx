
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertTriangle, Phone, Sparkles, LogOut, CheckCircle, XCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/layout/Footer';

const VoiceSearchPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
    const { speak, stop, isSpeaking } = useTextToSpeech();
    const [showRipples, setShowRipples] = useState(false);
    const [isEmergency, setIsEmergency] = useState<boolean | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [aiResponseText, setAiResponseText] = useState<string>('');
    const aiResponseRef = useRef<string>(''); // Use ref for immediate access
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (isListening) {
            setShowRipples(true);
        } else {
            const timer = setTimeout(() => setShowRipples(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isListening]);

    // Auto-analyze when user stops speaking - with proper delay
    useEffect(() => {
        if (!isListening && transcript.trim() && isEmergency === null && !analyzing) {
            // Wait 1.5 seconds after stopping to ensure transcript is complete
            const analyzeTimer = setTimeout(() => {
                console.log('Auto-analyzing transcript:', transcript);
                handleAnalyze();
            }, 1500);
            return () => clearTimeout(analyzeTimer);
        }
    }, [isListening, transcript, isEmergency, analyzing]);

    // Emergency keywords detection
    const detectEmergency = (text: string): boolean => {
        const emergencyKeywords = [
            'emergency', 'help', 'urgent', 'critical', 'severe pain',
            'can\'t breathe', 'cannot breathe', 'chest pain', 'heart attack',
            'stroke', 'unconscious', 'bleeding heavily', 'choking',
            'severe bleeding', 'broken bone', 'head injury', 'seizure',
            'overdose', 'poisoning', 'allergic reaction', 'anaphylaxis',
            'difficulty breathing', 'shortness of breath', 'stabbing',
            'gunshot', 'car accident', 'fall', 'burn', 'electric shock', 'accident'
        ];

        const lowerText = text.toLowerCase();
        return emergencyKeywords.some(keyword => lowerText.includes(keyword));
    };

    // Generate suggestions based on input using AI
    const generateSuggestions = async (text: string): Promise<string[]> => {
        try {
            // Call AI agent to get intelligent response
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful medical first-aid assistant. Provide clear, concise, and actionable advice for non-emergency medical situations. Format your response as 5 numbered bullet points (1. 2. 3. 4. 5.), each being a specific actionable step or piece of advice. Keep each point brief and practical. Start with a brief intro sentence, then list the 5 points.'
                        },
                        {
                            role: 'user',
                            content: `I have the following non-emergency health concern: ${text}. Please provide 5 specific, actionable suggestions to help me.`
                        }
                    ],
                    model: 'gpt-4o-mini'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API returned status ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.reply; // Server returns 'reply' not 'response'

            if (!aiResponse) {
                throw new Error('No response from AI');
            }

            // Store the full AI response for text-to-speech
            setAiResponseText(aiResponse);
            aiResponseRef.current = aiResponse;

            // Parse the AI response into bullet points
            const lines = aiResponse.split('\n').filter((line: string) => line.trim());
            const suggestions: string[] = [];

            for (const line of lines) {
                // Match lines that start with numbers, bullets, or dashes
                const cleaned = line.replace(/^[\d\.\-\*\•]\s*/, '').trim();
                if (cleaned && suggestions.length < 5) {
                    suggestions.push(cleaned);
                }
            }

            // If we couldn't parse bullet points, split by sentences
            if (suggestions.length === 0) {
                const sentences = aiResponse.split(/[.!?]+/).filter((s: string) => s.trim());
                return sentences.slice(0, 5).map((s: string) => s.trim());
            }

            return suggestions.slice(0, 5);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            // Return fallback suggestions
            return [
                'Stay calm and assess your symptoms',
                'Rest in a comfortable position',
                'Stay hydrated with water',
                'Monitor your symptoms for any changes',
                'Consult a healthcare professional if symptoms persist'
            ];
        }
    };

    const handleAnalyze = async () => {
        if (!transcript.trim()) return;

        setAnalyzing(true);

        try {
            const emergencyDetected = detectEmergency(transcript);
            setIsEmergency(emergencyDetected);

            if (emergencyDetected) {
                // Speak emergency alert
                speak("Emergency detected! I recommend calling emergency services immediately.");
            } else {
                // Get AI suggestions and speak them
                try {
                    const generatedSuggestions = await generateSuggestions(transcript);
                    setSuggestions(generatedSuggestions);

                    // Speak the AI response using ref for immediate access
                    if (aiResponseRef.current) {
                        speak(aiResponseRef.current);
                    } else {
                        // Fallback speech if no AI response
                        speak("Here are some general suggestions for your situation. Please consult a healthcare professional for personalized advice.");
                    }
                } catch (aiError) {
                    console.error('AI generation error:', aiError);
                    // Set fallback suggestions
                    const fallbackSuggestions = [
                        'Stay calm and assess your symptoms',
                        'Rest in a comfortable position',
                        'Stay hydrated with water',
                        'Monitor your symptoms for any changes',
                        'Consult a healthcare professional if symptoms persist'
                    ];
                    setSuggestions(fallbackSuggestions);
                    speak("I'm having trouble connecting to the AI service. Here are some general suggestions.");

                    toast({
                        title: "AI Service Unavailable",
                        description: "Showing general suggestions. Please ensure the server is running.",
                        variant: "destructive"
                    });
                }
            }
        } catch (error) {
            console.error('Error analyzing:', error);
            toast({
                title: "Error",
                description: "Failed to analyze your situation. Please try again.",
                variant: "destructive"
            });
            setIsEmergency(null);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCallEmergency = () => {
        // Call 911
        window.location.href = 'tel:911';

        toast({
            title: "Emergency Call Initiated",
            description: "Calling emergency services (911)...",
            variant: "destructive"
        });
    };

    const handleReset = () => {
        stop(); // Stop any ongoing speech
        resetTranscript();
        setIsEmergency(null);
        setSuggestions([]);
        setAiResponseText('');
        setAnalyzing(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
        toast({
            title: "Signed out",
            description: "You've been successfully signed out.",
        });
    };

    if (!isSupported) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <h2 className="text-2xl font-bold text-destructive mb-2">Voice Not Supported</h2>
                <p className="text-muted-foreground">Your browser does not support speech recognition.</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="flex-shrink-0 h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6 relative z-50">
                <div className="flex items-center gap-3 ml-12 lg:ml-0">
                    <img
                        src="/voice-mode-logo.png"
                        alt="Voice Mode"
                        className="w-9 h-9 object-contain"
                    />
                    <div>
                        <h1 className="font-semibold text-foreground">HelpNow Voice Assistant</h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">Speak to detect emergencies</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {user && (
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
                    )}
                </div>
            </header>

            {/* Main Content - Dynamic Layout */}
            <main className={`flex-1 relative flex flex-col items-center p-4 ${(isEmergency !== null || suggestions.length > 0)
                ? 'overflow-y-auto justify-start py-8'
                : 'overflow-hidden justify-center'
                }`}>

                {/* Background Ambient Animations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-primary/5 blur-3xl"
                            initial={{
                                x: Math.random() * 100 - 50 + "%",
                                y: Math.random() * 100 - 50 + "%",
                                scale: 1,
                                opacity: 0.3
                            }}
                            animate={{
                                x: Math.random() * 100 - 50 + "%",
                                y: Math.random() * 100 - 50 + "%",
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                                duration: 10 + Math.random() * 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{
                                width: `${300 + Math.random() * 300}px`,
                                height: `${300 + Math.random() * 300}px`,
                            }}
                        />
                    ))}
                </div>

                <div className="z-10 flex flex-col items-center max-w-2xl w-full text-center">

                    {!transcript && !isEmergency && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                                HelpNow Voice Assistant
                            </h1>
                            <p className="text-muted-foreground text-lg mb-12">
                                Speak to describe your situation
                            </p>
                        </motion.div>
                    )}

                    {/* Dynamic Microphone Button Container */}
                    {!isEmergency && (
                        <div className="relative mb-12 group">

                            {/* Pulsating Ripples */}
                            <AnimatePresence>
                                {isListening && (
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute inset-0 rounded-full border border-primary/30 bg-primary/5"
                                                initial={{ scale: 1, opacity: 1 }}
                                                animate={{ scale: 2.5, opacity: 0 }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    delay: (i - 1) * 0.6,
                                                    ease: "easeOut"
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Core Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                animate={isListening ? {
                                    boxShadow: "0 0 40px 10px rgba(var(--primary), 0.4)",
                                } : {
                                    boxShadow: "0 0 0px 0px rgba(var(--primary), 0)"
                                }}
                                onClick={isListening ? stopListening : startListening}
                                className={`
                                    relative z-20 w-32 h-32 rounded-full flex items-center justify-center 
                                    transition-all duration-300
                                    ${isListening
                                        ? 'bg-gradient-to-tr from-destructive to-red-500'
                                        : 'bg-gradient-to-tr from-primary to-blue-500 hover:shadow-lg hover:shadow-primary/25'
                                    }
                                `}
                            >
                                {isListening ? (
                                    <MicOff className="w-12 h-12 text-white" />
                                ) : (
                                    <Mic className="w-12 h-12 text-white" />
                                )}
                            </motion.button>
                        </div>
                    )}

                    {/* Transcript Display area */}
                    <div className="min-h-[100px] w-full flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {transcript && !isEmergency && isEmergency !== false ? (
                                <motion.div
                                    key="transcript"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-white/10 shadow-xl w-full max-w-lg"
                                >
                                    <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed mb-4">
                                        "{transcript}"
                                    </p>

                                    {analyzing && (
                                        <div className="flex items-center justify-center gap-2 mt-4">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                            <span className="text-muted-foreground">Analyzing your situation...</span>
                                        </div>
                                    )}
                                </motion.div>
                            ) : isEmergency === true ? (
                                <motion.div
                                    key="emergency"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-2xl bg-destructive/10 backdrop-blur border-2 border-destructive shadow-xl w-full max-w-lg"
                                >
                                    <div className="flex flex-col items-center gap-4">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        >
                                            <AlertTriangle className="w-16 h-16 text-destructive" />
                                        </motion.div>
                                        <h2 className="text-2xl font-bold text-destructive">EMERGENCY DETECTED</h2>
                                        <p className="text-foreground text-center">
                                            Based on your description, this appears to be an emergency situation.
                                        </p>
                                        <div className="flex flex-col gap-3 w-full mt-4">
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                onClick={handleCallEmergency}
                                                className="w-full text-lg py-6 bg-transparent border-2 border-cyan-400 text-white hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"
                                            >
                                                <Phone className="w-5 h-5 mr-2" />
                                                Call Emergency Services (108)
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleReset}
                                                className="w-full bg-transparent border-2 border-cyan-400 text-white hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"
                                            >
                                                Cancel / Try Again
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : isEmergency === false && suggestions.length > 0 ? (
                                <motion.div
                                    key="suggestions"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-2xl bg-card/50 backdrop-blur border border-primary/20 shadow-xl w-full max-w-lg"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                        <h2 className="text-xl font-bold text-foreground">No Emergency Detected</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">Here are some suggestions:</p>
                                    <ul className="space-y-3 text-left">
                                        {suggestions.map((suggestion, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex items-start gap-2 text-foreground"
                                            >
                                                <span className="text-primary mt-1">•</span>
                                                <span>{suggestion}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                    <div className="flex gap-3 mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => isSpeaking ? stop() : speak(aiResponseText)}
                                            className="flex-1 bg-transparent border-2 border-cyan-400 text-white hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"
                                        >
                                            {isSpeaking ? (
                                                <>
                                                    <VolumeX className="w-4 h-4 mr-2" />
                                                    Stop Speaking
                                                </>
                                            ) : (
                                                <>
                                                    <Volume2 className="w-4 h-4 mr-2" />
                                                    Speak Again
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleReset}
                                            className="flex-1 bg-transparent border-2 border-cyan-400 text-white hover:bg-cyan-400/10 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"
                                        >
                                            Start New Assessment
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : !isListening && !transcript ? (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-muted-foreground flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span>Ready to listen</span>
                                </motion.div>
                            ) : isListening ? (
                                <motion.div
                                    key="listening"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-primary flex items-center gap-2"
                                >
                                    <span className="animate-pulse text-lg">Listening...</span>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default VoiceSearchPage;
