import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Loader2,
  Sparkles,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import { summarizeText, analyzeMedicalImage } from '@/lib/openai';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/layout/Footer';

const SummarizerPage = () => {
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hardcoded model for simplicity as requested (using a capable vision model)
  const selectedModel = 'gpt-4o-mini';

  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSummary(''); // Clear previous summary

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageData(event.target?.result as string || null);
        };
        reader.readAsDataURL(file);
      } else {
        setImageData(null);
        // For simple text files, we read the content to send to summarizer later
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            (window as any).tempTextContent = event.target?.result as string;
          };
          reader.readAsText(file);
        } else {
          (window as any).tempTextContent = ""; // Reset if not text/image
        }
      }
    }
  };

  const handleSummarize = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a medical document or prescription first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSummary('');

    // Simulate scanning delay for effect
    await new Promise(r => setTimeout(r, 1500));

    try {
      let aiSummary = '';
      if (imageData) {
        aiSummary = await analyzeMedicalImage(imageData, '', selectedModel);
      } else {
        // Fallback for text files
        const textContent = (window as any).tempTextContent || '';
        if (!textContent && !imageData) {
          // If PDF or Doc (client side parsing is hard without lib), we currently only support img/txt in this simplified node
          // Assuming the user knows to upload supported formats as indicated.
          // For now, let's treat it as an error if we can't read it, or mock it if it's a demo.
          // Actually, the prompt allows "files", but without a PDF parser, we can't read PDFs client side easily without a library.
          // I'll assume text/image for now or provide a graceful fallback message.
          throw new Error("Cannot process this file type directly. Please upload an Image or Text file.");
        }
        aiSummary = await summarizeText(textContent, selectedModel);
      }

      setSummary(aiSummary);
      if (ttsSupported) {
        speak("Analysis complete. Here is your summary.");
      }
    } catch (err: any) {
      console.error('Summarization error', err);
      toast({
        title: 'Analysis failed',
        description: err?.message || 'Unable to analyze document.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setSummary('');
    setUploadedFile(null);
    setImageData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    (window as any).tempTextContent = '';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Abstract Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header (Premium Bar Style) */}
      <header className="flex-shrink-0 h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6 z-50">
        <div className="flex items-center gap-3 ml-12 lg:ml-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-white/5">
            <img src="/info-summarizer-logo.png" alt="Info Summarizer" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground tracking-tight">Info Summarizer</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Simplify medical documents</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="mr-2 hidden sm:flex border-primary/20 hover:border-primary hover:bg-primary/5 text-primary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              New Summary
            </Button>
          )}

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
                onClick={async () => {
                  await logout();
                  toast({
                    title: "Signed out",
                    description: "You've been successfully signed out.",
                  });
                }}
                className="h-8 px-3 text-xs bg-red-950/80 hover:bg-red-950"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-5xl mx-auto">

        <AnimatePresence mode='wait'>
          {!summary ? (
            <motion.div
              key="upload-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70"
                >
                  Medical Analysis, Simplified.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-muted-foreground"
                >
                  Upload your prescription or report. AI does the rest.
                </motion.p>
              </div>

              {/* Ultra-Premium Upload Box */}
              <motion.div
                whileHover={{ scale: 1.02, borderColor: "var(--primary)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative group cursor-pointer w-full bg-card/30 backdrop-blur-xl 
                  border-2 ${uploadedFile ? 'border-primary/50' : 'border-dashed border-white/10'} 
                  rounded-3xl p-12 flex flex-col items-center justify-center
                  transition-all duration-300 hover:bg-card/40 hover:shadow-2xl hover:shadow-primary/5
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Animated Background Gradient inside Box */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {imageData ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full max-w-xs aspect-[3/4] rounded-lg overflow-hidden shadow-2xl border border-white/10"
                  >
                    <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white text-sm font-medium truncate">
                      {uploadedFile?.name}
                    </div>
                    {/* Scanning Line Animation */}
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_15px_rgba(var(--primary),1)]"
                    />
                  </motion.div>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Upload className="w-10 h-10 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Upload Document</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      Drag & Drop your prescription or click to browse.
                      <span className="block mt-2 text-xs opacity-60">Supports JPG, PNG, TXT</span>
                    </p>
                  </>
                )}
              </motion.div>

              {/* Action Button */}
              <div className="mt-8 w-full max-w-md">
                <Button
                  size="lg"
                  onClick={handleSummarize}
                  disabled={!uploadedFile || isProcessing}
                  className={`
                        w-full h-14 text-lg font-medium rounded-2xl shadow-lg shadow-primary/20
                        bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500
                        transition-all duration-300 relative overflow-hidden
                    `}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 fill-white/20" />
                      <span>Summarize Now</span>
                    </div>
                  )}
                </Button>
              </div>

            </motion.div>
          ) : (
            /* Results View */
            <motion.div
              key="results-stage"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
              className="w-full max-w-4xl bg-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Analysis Complete</h2>
                    <p className="text-sm text-muted-foreground">Based on {uploadedFile?.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearAll} className="hover:bg-white/10">
                    Analyze Another
                  </Button>
                  {ttsSupported && (
                    <Button
                      variant={isSpeaking ? "destructive" : "outline"}
                      size="sm"
                      onClick={isSpeaking ? stop : () => speak(summary.replace(/[*•#]/g, ''))}
                    >
                      {isSpeaking ? "Stop Reading" : "Read Aloud"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-8 md:p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="prose prose-invert prose-lg max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {summary}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border-t border-white/5 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3" /> AI-Generated Medical Summary. Consult a general physician for professional advice.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default SummarizerPage;