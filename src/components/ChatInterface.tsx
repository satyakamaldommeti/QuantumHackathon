import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, VolumeX, Stethoscope, Heart, Pill, Thermometer, Upload, Copy, Check, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { chatCompletion } from '@/lib/openai';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { VoiceWave } from './VoiceWave';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  imageUrl?: string;
}

interface ChatInterfaceProps {
  onEmergencyDetected?: () => void;
}

// Suggested questions for the welcome screen
const suggestedQuestions = [
  { icon: Stethoscope, text: "What are the symptoms of flu?" },
  { icon: Heart, text: "How to manage high blood pressure?" },
  { icon: Pill, text: "Healthy meal planning for busy schedules" },
  { icon: Thermometer, text: "How to improve sleep quality naturally?", },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onEmergencyDetected }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [proxyUnreachable, setProxyUnreachable] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported: speechSupported } = useSpeechRecognition();
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInputValue(transcript);
      handleSend(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  // Handle incoming voice search state from VoiceSearchPage
  useEffect(() => {
    if (location.state && (location.state as any).initialMessage) {
      const msg = (location.state as any).initialMessage;
      // Use history replacement to prevent re-trigger on refresh
      window.history.replaceState({}, document.title);

      // Short timeout to ensure component is fully mounted/ready
      setTimeout(() => {
        handleSend(msg);
      }, 500);
    }
  }, [location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop(); // Stop speaking
      stopListening(); // Stop listening
    };
  }, []);

  // Load conversation from URL, Session Storage, or most recent conversation
  useEffect(() => {
    const loadConversation = async () => {
      const params = new URLSearchParams(window.location.search);
      const paramId = params.get('conversationId');
      const storedId = sessionStorage.getItem('activeConversationId');

      // Check if user just clicked "New Chat" (within last 1 second)
      const newChatTimestamp = sessionStorage.getItem('newChatRequested');
      const isRecentNewChat = newChatTimestamp && (Date.now() - parseInt(newChatTimestamp)) < 1000;

      if (isRecentNewChat) {
        // User just clicked New Chat, don't load anything
        sessionStorage.removeItem('newChatRequested');
        console.log('🆕 Starting new chat - skipping auto-load');
        return;
      }

      // Determine which ID to use: URL param > Stored ID
      let targetId = paramId || storedId;

      // If no conversation ID found, try to load the most recent conversation
      if (!targetId && user) {
        try {
          const userId = user.uid || 'anonymous';
          const response = await fetch(`http://localhost:3001/api/conversations?userId=${userId}`);
          if (response.ok) {
            const conversations = await response.json();
            if (conversations && conversations.length > 0) {
              // Get the most recent conversation
              targetId = conversations[0].id;
              console.log('📥 Loading most recent conversation:', targetId);
            }
          }
        } catch (error) {
          console.error('Error fetching recent conversations:', error);
        }
      }

      // Load the conversation if we have an ID
      if (targetId && targetId !== conversationId) {
        try {
          const response = await fetch(`http://localhost:3001/api/conversations/${targetId}`);
          if (response.ok) {
            const data = await response.json();

            // Map backend messages to frontend format
            const loadedMessages: Message[] = data.messages.map((m: any) => ({
              id: m._id || Date.now().toString() + Math.random(),
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp)
            }));

            setMessages(loadedMessages);
            setConversationId(data._id);
            sessionStorage.setItem('activeConversationId', data._id);
            console.log('✅ Loaded conversation:', data._id);
          } else {
            // If failed (e.g. deleted), clear storage
            sessionStorage.removeItem('activeConversationId');
            console.error('Failed to load conversation');
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
        }
      }
    };

    loadConversation();
  }, [location.search, user]); // Re-run when URL params or user changes

  // Save conversation to MongoDB
  const saveConversation = async (newMessages: Message[], isNew: boolean = false) => {
    try {
      const userId = user?.uid || 'anonymous';
      console.log('💾 Saving conversation...', { isNew, conversationId, messageCount: newMessages.length, userId });

      if (isNew || !conversationId) {
        // Create new conversation
        const conversationData = {
          userId,
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date()
          })),
          isEmergency: false
        };

        console.log('📤 Creating new conversation:', conversationData);

        const response = await fetch('http://localhost:3001/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversationData)
        });

        if (response.ok) {
          const conversation = await response.json();
          setConversationId(conversation._id);
          sessionStorage.setItem('activeConversationId', conversation._id);
          console.log('✅ Conversation created successfully:', conversation._id);
          return true;
        } else {
          const error = await response.json();
          console.error('❌ Failed to create conversation:', error);
          return false;
        }
      } else {
        // Add message to existing conversation
        const lastMessage = newMessages[newMessages.length - 1];

        console.log('📤 Adding message to conversation:', conversationId);

        const response = await fetch(`http://localhost:3001/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: lastMessage.role,
            content: lastMessage.content
          })
        });

        if (response.ok) {
          console.log('✅ Message added to conversation:', conversationId);
          return true;
        } else {
          const error = await response.json();
          console.error('❌ Failed to add message:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error saving to MongoDB:', error);
      return false;
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      imageUrl: selectedImage || undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setSelectedImage(null); // Clear image after sending
    setIsProcessing(true);

    const useProxy = (import.meta as any).env?.VITE_USE_PROXY !== 'false';
    const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;

    try {
      if (openaiKey || useProxy) {
        const systemPrompt = {
          role: 'system',
          content: "You are Care Shield, a calm, empathetic AI healthcare assistant. Provide clear, actionable, and concise guidance for health and first-aid situations. When unsure, encourage seeking professional medical help. Do not provide diagnoses, only general guidance."
        };

        const history: any[] = [
          systemPrompt,
          ...messages.map((m) => {
            if (m.imageUrl) {
              return {
                role: m.role,
                content: [
                  { type: 'text', text: m.content },
                  { type: 'image_url', image_url: { url: m.imageUrl } }
                ]
              };
            }
            return { role: m.role, content: m.content };
          })
        ];

        // Add current message
        if (userMessage.imageUrl) {
          history.push({
            role: 'user',
            content: [
              { type: 'text', text: userMessage.content },
              { type: 'image_url', image_url: { url: userMessage.imageUrl } }
            ]
          });
        } else {
          history.push({ role: 'user', content: userMessage.content });
        }

        const aiResponse = await chatCompletion(history, selectedModel);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };

        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);

        // Save to MongoDB - save the complete conversation
        if (messages.length === 0) {
          // First message pair - create new conversation with both messages
          await saveConversation([userMessage, assistantMessage], true);
        } else {
          // Existing conversation - add user message first, then assistant message
          await saveConversation([userMessage], false);
          await saveConversation([assistantMessage], false);
        }

        setIsProcessing(false);

        if (voiceEnabled && ttsSupported) speak(aiResponse);

        // Emergency detection
        const lower = messageText.toLowerCase();
        const isEmergency = /chest pain|heart attack|can't breathe|cant breathe|unconscious|choking|severe bleeding|stop breathing|stroke|seizure/.test(lower);
        if (isEmergency && onEmergencyDetected) onEmergencyDetected();
      }
    } catch (err: any) {
      console.error('Chat AI error', err);
      const messageText = err?.message || String(err);

      if (messageText.includes('Proxy') || messageText.includes('Failed to fetch') || messageText.includes('404')) {
        setProxyUnreachable(messageText);
      }

      const detail = messageText ? ` (${messageText})` : '';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry — I am unable to reach the AI service right now. Please try again shortly.${detail}`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
      if (voiceEnabled && ttsSupported) speak(assistantMessage.content);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    handleSend(question);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    // Always stop speaking first if currently speaking
    if (isSpeaking) {
      stop();
    }
    // Then toggle the voice enabled state
    setVoiceEnabled(!voiceEnabled);
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    sessionStorage.removeItem('activeConversationId');
    console.log('🆕 Started new chat');
  };

  return (
    <div className="flex flex-col h-full">
      {proxyUnreachable && (
        <div className="bg-red-900/60 text-red-100 p-3 text-sm">
          <div className="max-w-2xl mx-auto">
            <strong>Proxy unreachable:</strong> {proxyUnreachable}
            <div className="mt-2">
              Start the server proxy locally with your OpenAI key:
              <pre className="mt-1 p-2 bg-black/20 rounded">OPENAI_API_KEY=sk-... node server/index.js</pre>
            </div>
          </div>
        </div>
      )}

      {/* Messages or Welcome Screen */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center h-full px-4 py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="relative mb-6"
            >
              <img
                src="/care-shield-logo.png"
                alt="Care Shield"
                className="w-24 h-24 object-contain"
              />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-background"></div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold text-primary mb-3"
            >
              Welcome to Care Shield
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-center max-w-md mb-2"
            >
              Your AI-powered health companion ready to answer medical questions and provide health guidance.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground mb-8"
            >
              Click any question below to get started...
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              {suggestedQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestedQuestion(question.text)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent transition-all text-left"
                >
                  <question.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm text-foreground">{question.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card border border-border text-foreground rounded-tl-sm'
                      }`}
                  >
                    {message.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={message.imageUrl}
                          alt="User upload"
                          className="max-w-full rounded-lg max-h-60 object-contain bg-black/20"
                        />
                      </div>
                    )}
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {/* Action buttons for Assistant */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border/40">
                        <Button
                          variant="default"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => {
                            stop(); // Stop any currently playing audio first
                            speak(message.content);
                          }}
                          title="Read aloud"
                        >
                          <Volume2 className="h-4 w-4 opacity-70" />
                        </Button>
                        <Button
                          variant="default"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => handleCopy(message.content, message.id)}
                          title="Copy text"
                        >
                          {copiedId === message.id ?
                            <Check className="h-4 w-4 text-green-500" /> :
                            <Copy className="h-4 w-4 opacity-70" />
                          }
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Voice Listening Indicator */}
      {isListening && (
        <div className="px-4 py-2 bg-primary/10 border-t border-primary/20">
          <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
            <VoiceWave isActive={isListening} />
            <span className="text-primary font-medium">Listening...</span>
          </div>
          {transcript && (
            <p className="text-center text-muted-foreground mt-2 italic">"{transcript}"</p>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border">
        {selectedImage && (
          <div className="px-4 pt-4 pb-0 flex items-center gap-2">
            <div className="relative inline-block">
              <img src={selectedImage} alt="Selected" className="h-16 w-16 object-cover rounded-md border border-primary/50" />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 hover:bg-destructive/90 transition-colors"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">Image attached</span>
          </div>
        )}
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-48 neon-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Recommended</SelectLabel>
                  <SelectItem value="gpt-4o-mini">Llama 3.3 70B (Recommended)</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Other Models</SelectLabel>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="mixtral-8x7b">Mixtral 8x7B</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant={isSpeaking ? "destructive" : "default"}
              size="icon"
              onClick={toggleVoiceOutput}
              title={isSpeaking ? "Stop speaking" : (voiceEnabled ? "Voice enabled" : "Voice disabled")}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : (voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />)}
            </Button>

            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="ml-auto gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                New Chat
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 neon-text shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image"
            >
              <Upload className="h-5 w-5" />
            </Button>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a health question or upload a file..."
              className="flex-1 h-12 neon-input"
              disabled={isListening}
            />

            {speechSupported && (
              <Button
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                className="h-12 w-12 neon-text"
                onClick={handleVoiceToggle}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}

            <Button
              variant="default"
              size="icon"
              className="h-12 w-12"
              onClick={() => handleSend()}
              disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* <p className="text-xs text-muted-foreground text-center mt-2">
            Care Shield can make mistakes. Check important info.
          </p> */}
        </div>
      </div>
    </div>
  );
};
