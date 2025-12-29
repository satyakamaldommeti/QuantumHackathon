import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Droplets,
  AlertCircle,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Type,
  LogOut,
  Save,
  Settings,
  Camera,
  Mail,
  Calendar,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/layout/Footer';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

const ProfilePage = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Profile data
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
  });

  // Fetch profile on mount
  React.useEffect(() => {
    if (authLoading || !user) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/profiles/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setProfile({
            displayName: data.name || user.displayName || '',
            email: data.email || user.email || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender || '',
            phoneNumber: data.phoneNumber || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const profileData = {
        name: profile.displayName,
        email: profile.email,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        phoneNumber: profile.phoneNumber,
      };

      const response = await fetch(`http://localhost:3001/api/profiles/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        });
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 ml-12 lg:ml-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <img src="/profile-logo.png" alt="Profile" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h1 className="font-semibold text-white">My Profile</h1>
            <p className="text-xs text-gray-400 hidden sm:block">Settings & Preferences</p>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Settings
            </h2>

            {/* Profile Photo */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white text-3xl font-bold">
                {profile.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0">
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG, or GIF. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-white">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Enter your display name"
                  className="text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="opacity-60 text-white"
                />
                <p className="text-xs text-gray-400">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-white">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  placeholder="dd-mm-yyyy"
                  className="text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-white">Gender</Label>
                <select
                  id="gender"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-white"
                >
                  <option value="" className="text-white">Select gender</option>
                  {genders.map(g => (
                    <option key={g} value={g} className="text-white">{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-white">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <Button
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold border-0"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Saving...' : 'Update Profile'}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
