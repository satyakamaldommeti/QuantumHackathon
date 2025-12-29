import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/layout/Footer';

const FeedbackPage = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'general', label: 'General Feedback', icon: MessageSquare },
    { id: 'bug', label: 'Report a Bug', icon: ThumbsDown },
    { id: 'feature', label: 'Feature Request', icon: ThumbsUp },
  ];

  const handleSubmit = async () => {
    if (!rating || !feedback.trim()) {
      toast({
        title: "Incomplete Feedback",
        description: "Please provide a rating and your feedback.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log feedback data (for development purposes)
    console.log('Feedback submitted:', {
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || 'anonymous',
      rating,
      category: category || 'general',
      feedback: feedback.trim(),
      timestamp: new Date().toISOString()
    });

    // Always show success
    setSubmitted(true);
    setIsSubmitting(false);

    toast({
      title: "Feedback Submitted!",
      description: "Thank you for helping us improve Care Shield.",
      className: "bg-green-600 border-none text-white"
    });

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setFeedback('');
      setCategory('');
    }, 3000);
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 ml-12 lg:ml-0">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/feedback-logo.png" alt="Feedback" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">Feedback</h1>
            <p className="text-xs text-gray-400">Help us improve Care Shield</p>
          </div>
        </div>

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
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-3xl mx-auto">
          {submitted ? (
            // Success State
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card/50 backdrop-blur border border-border rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]"
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-3">Thank You!</h2>
              <p className="text-gray-400 text-center max-w-md">
                Your feedback has been submitted successfully. We appreciate your input and will use it to improve Care Shield.
              </p>
            </motion.div>
          ) : (
            // Feedback Form
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 space-y-8"
            >
              {/* Rating Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Rate Your Experience</h2>
                <p className="text-gray-400">How would you rate your experience with Care Shield?</p>

                <div className="flex items-center gap-3 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-12 h-12 ${star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                          }`}
                      />
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <p className="text-sm text-gray-400">
                    {rating === 1 && "We're sorry to hear that. Please tell us how we can improve."}
                    {rating === 2 && "We appreciate your feedback. How can we do better?"}
                    {rating === 3 && "Thanks for your feedback. What can we improve?"}
                    {rating === 4 && "Great! What did you like most?"}
                    {rating === 5 && "Excellent! We're glad you had a great experience!"}
                  </p>
                )}
              </div>

              {/* Category Selection */}
              <div className="space-y-4">
                <Label className="text-white text-lg">Feedback Category</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${category === cat.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card/30 hover:border-primary/50'
                          }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${category === cat.id ? 'text-primary' : 'text-gray-400'
                          }`} />
                        <p className={`text-sm font-medium ${category === cat.id ? 'text-white' : 'text-gray-400'
                          }`}>
                          {cat.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Text */}
              <div className="space-y-4">
                <Label htmlFor="feedback" className="text-white text-lg">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience, suggestions, or any issues you encountered..."
                  className="min-h-[150px] bg-card border-border focus:border-primary text-white placeholder:text-gray-500 resize-none"
                />
                <p className="text-xs text-gray-400">
                  {feedback.length} / 500 characters
                </p>
              </div>

              {/* Submit Button */}
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || !rating || !feedback.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold border-0"
              >
                <Send className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeedbackPage;
