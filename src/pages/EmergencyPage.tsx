import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Phone,
    MessageSquare,
    MapPin,
    Send,
    CheckCircle2,
    Plus,
    Trash2,
    UserPlus,
    Mic,
    FileText,
    History,
    User,
    LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/layout/Footer';

interface Contact {
    _id?: string;
    name: string;
    email: string;
    relation: string;
}

const EmergencyPage = () => {
    const { toast } = useToast();
    const { user, logout } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [message, setMessage] = useState(
        "HELP! I am experiencing a medical emergency. Please contact me immediately. My location is: [GPS_COORDS]"
    );

    // New Contact Form State
    const [newContact, setNewContact] = useState({ name: '', email: '', relation: '' });

    // Fetch emergency contacts from MongoDB on component mount
    useEffect(() => {
        const fetchContacts = async () => {
            if (!user?.email) return;

            try {
                const response = await fetch(`/api/profiles/${user.email}/emergency-contacts`);
                if (response.ok) {
                    const data = await response.json();
                    setContacts(data.emergencyContacts || []);
                }
            } catch (error) {
                console.error('Error fetching emergency contacts:', error);
                toast({
                    title: "Error",
                    description: "Failed to load emergency contacts",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchContacts();
    }, [user?.email, toast]);

    const handleSendEmail = async () => {
        if (contacts.length === 0) {
            toast({
                title: "No contacts",
                description: "Please add emergency contacts first.",
                variant: "destructive"
            });
            return;
        }

        setIsSending(true);

        try {
            // Get GPS location
            let locationUrl = '';

            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                        });
                    });

                    const { latitude, longitude } = position.coords;
                    locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
                    console.log('📍 Location obtained:', locationUrl);
                } catch (geoError) {
                    console.warn('Could not get GPS location:', geoError);
                    // Use mock coordinates as fallback
                    locationUrl = 'https://maps.google.com/?q=37.7749,-122.4194';
                }
            } else {
                // Fallback if geolocation not supported
                locationUrl = 'https://maps.google.com/?q=37.7749,-122.4194';
            }

            // Replace location placeholder in message
            const finalMessage = message.replace('[GPS_COORDS]', locationUrl);

            // Send emergency email via API
            const response = await fetch('/api/emergency/send-alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contacts: contacts,
                    message: finalMessage,
                    senderName: user?.displayName || user?.email?.split('@')[0] || 'Emergency User',
                    senderEmail: user?.email || 'unknown@aidspeak.com',
                    location: locationUrl,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send emergency alert');
            }

            setIsSending(false);
            setSentSuccess(true);

            toast({
                title: "SOS Sent Successfully! 🚨",
                description: `Emergency alert sent to ${contacts.length} contact(s) via Email.`,
                className: "bg-green-600 border-none text-white"
            });

            console.log('✅ Emergency alert sent:', data);

            // Reset success state after few seconds
            setTimeout(() => setSentSuccess(false), 5000);

        } catch (error) {
            console.error('Error sending emergency alert:', error);
            setIsSending(false);

            toast({
                title: "Failed to Send Alert",
                description: error instanceof Error ? error.message : "Could not send emergency email. Please try again.",
                variant: "destructive"
            });
        }
    };

    const addContact = async () => {
        if (!newContact.name || !newContact.email) {
            toast({
                title: "Missing information",
                description: "Please provide both name and email",
                variant: "destructive"
            });
            return;
        }

        if (!user?.email) {
            toast({
                title: "Error",
                description: "User not logged in",
                variant: "destructive"
            });
            return;
        }

        try {
            console.log('Adding contact:', newContact);
            console.log('User email:', user.email);

            const response = await fetch(`/api/profiles/${user.email}/emergency-contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newContact),
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                setContacts(data.emergencyContacts || []);
                setNewContact({ name: '', email: '', relation: '' });
                setIsDialogOpen(false); // Close dialog on success
                toast({ title: "Contact added successfully" });
            } else {
                throw new Error(data.error || 'Failed to add contact');
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add contact",
                variant: "destructive"
            });
        }
    };

    const removeContact = async (contactId: string) => {
        if (!user?.email || !contactId) return;

        try {
            const response = await fetch(`/api/profiles/${user.email}/emergency-contacts/${contactId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const data = await response.json();
                setContacts(data.emergencyContacts || []);
                toast({ title: "Contact removed successfully" });
            } else {
                throw new Error('Failed to remove contact');
            }
        } catch (error) {
            console.error('Error removing contact:', error);
            toast({
                title: "Error",
                description: "Failed to remove contact",
                variant: "destructive"
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

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header with App Logo/Title */}
            <header className="flex-shrink-0 h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-3 ml-12 lg:ml-0">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img src="/emergency-logo.png" alt="Emergency SOS" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-foreground">Emergency SOS</h1>
                        <p className="text-xs text-muted-foreground">Send alerts to your contacts</p>
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
                                className="h-8 px-3 text-xs bg-red-950/80 hover:bg-red-950 text-red-200"
                            >
                                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 p-6 max-w-6xl mx-auto w-full grid gap-8 lg:grid-cols-2">
                {/* Review Alert Message Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 shadow-2xl h-full flex flex-col"
                >
                    <h2 className="text-2xl font-bold mb-4 text-foreground">Review Alert Message</h2>

                    <div className="relative mb-8">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[140px] bg-card border-border focus:border-primary text-foreground resize-none rounded-xl text-base p-4"
                            placeholder="Describe your emergency situation..."
                        />
                        <span className="absolute bottom-3 right-3 text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Location will be auto-attached
                        </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <AnimatePresence mode='wait'>
                            {sentSuccess ? (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 text-green-400 rounded-2xl p-8 flex flex-col items-center justify-center border border-green-500/20 w-full min-h-[200px]"
                                >
                                    <CheckCircle2 className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-bold">Alert Sent Successfully</h3>
                                    <p className="text-sm opacity-80 mt-1">Your contacts have been notified.</p>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center space-y-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSendEmail}
                                        disabled={isSending}
                                        className={`
                                            w-64 h-64 rounded-full flex flex-col items-center justify-center
                                            bg-gradient-to-br from-primary to-cyan-500 text-white shadow-2xl shadow-primary/20
                                            border-4 border-primary/30 relative group outline-none
                                            ${isSending ? 'opacity-80' : ''}
                                        `}
                                    >
                                        {/* Animated Rings */}
                                        <div className="absolute inset-0 rounded-full border border-white/20 scale-110 group-hover:scale-125 transition-transform duration-700" />
                                        <div className="absolute inset-0 rounded-full border border-white/10 scale-125 group-hover:scale-150 transition-transform duration-1000" />

                                        <Send className={`w-14 h-14 mb-3 ${isSending ? 'animate-pulse' : ''}`} />
                                        <span className="text-2xl font-bold tracking-wider">
                                            {isSending ? 'SENDING...' : 'SEND SOS'}
                                        </span>
                                        <span className="text-xs uppercase tracking-widest opacity-80 mt-2">Emergency Alert</span>
                                    </motion.button>
                                    <p className="text-sm text-muted-foreground text-center max-w-md">
                                        This will immediately send an Email with your location to all listed emergency contacts.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Contacts Management Card */}
                <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-8 shadow-2xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-primary" />
                            </div>
                            Family & Caregivers
                        </h2>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 border-0">
                                    <Plus className="w-4 h-4 mr-2" /> Add Contact
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border text-foreground">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">Add New Contact</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Name</Label>
                                        <Input
                                            placeholder="e.g. John Doe"
                                            value={newContact.name}
                                            onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                                            className="bg-card border-border text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Email Address</Label>
                                        <Input
                                            placeholder="e.g. john@example.com"
                                            value={newContact.email}
                                            onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                                            className="bg-card border-border text-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Relationship</Label>
                                        <Input
                                            placeholder="e.g. Spouse"
                                            value={newContact.relation}
                                            onChange={e => setNewContact({ ...newContact, relation: e.target.value })}
                                            className="bg-card border-border text-foreground"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-card">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                        onClick={addContact}
                                        className="ml-2 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 border-0"
                                    >
                                        Save Contact
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>Loading contacts...</p>
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <p>No contacts added yet. Add emergency contacts to get started.</p>
                            </div>
                        ) : (
                            contacts.map(contact => (
                                <motion.div
                                    key={contact._id}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-border hover:border-primary/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary flex items-center justify-center font-bold text-lg border border-primary/30">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{contact.name}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                {contact.relation} • {contact.email}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => removeContact(contact._id!)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-card/30 rounded-xl border border-border flex items-start gap-3 text-sm text-muted-foreground">
                        <MessageSquare className="w-5 h-5 mt-0.5 text-primary" />
                        <p>Alerts are sent via your connected automated Email service. Ensure contact emails are up-to-date.</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EmergencyPage;
