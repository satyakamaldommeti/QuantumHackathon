import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Activity, ArrowRight, CheckCircle, MessageCircle, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import Footer from '@/components/layout/Footer';

const LandingPage = () => {
    const { user } = useAuth();
    const [showAuth, setShowAuth] = React.useState(false);

    if (showAuth) {
        return <AuthScreen onBack={() => setShowAuth(false)} />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
            {/* Navbar */}
            <nav className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <img src="/care-shield-logo.png" alt="Care Shield" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        Care Shield
                    </span>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => setShowAuth(true)}>Sign In</Button>
                    <Button className="accent-gradient text-white" onClick={() => setShowAuth(true)}>
                        Get Started
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-5xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Shield className="w-4 h-4" />
                        <span>Advanced AI First Aid Assistant</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">
                        Your Personal <br />
                        <span className="text-primary">Health Companion</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Instant, AI-powered medical guidance when you need it most.
                        From emergency response to daily health questions, Care Shield is here for you 24/7.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="accent-gradient text-white h-14 px-8 text-lg rounded-full" onClick={() => setShowAuth(true)}>
                            Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5">
                            Learn More
                        </Button>
                    </div>
                </motion.div>

                {/* Floating UI Elements (Decorative) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute inset-0 pointer-events-none overflow-hidden"
                >
                    <div className="absolute top-1/3 left-10 p-4 bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl animate-float">
                        <Heart className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="absolute bottom-1/3 right-10 p-4 bg-card/10 backdrop-blur-md border border-white/10 rounded-2xl animate-float" style={{ animationDelay: '1s' }}>
                        <Activity className="w-8 h-8 text-green-500" />
                    </div>
                </motion.div>
            </header>

            {/* Features Grid */}
            <section className="w-full py-20 bg-card/30 backdrop-blur-sm border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Comprehensive Care Features</h2>
                        <p className="text-muted-foreground">Everything you need for peace of mind.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<MessageCircle className="w-6 h-6 text-blue-400" />}
                            title="AI Health Chat"
                            description="Real-time answers to your medical questions using advanced AI models."
                        />
                        <FeatureCard
                            icon={<FileText className="w-6 h-6 text-purple-400" />}
                            title="Document Analysis"
                            description="Upload and summarize medical reports instantly and securely."
                        />
                        <FeatureCard
                            icon={<Activity className="w-6 h-6 text-red-400" />}
                            title="Emergency Response"
                            description="Immediate guidance for critical situations with voice support."
                        />
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

export default LandingPage;
