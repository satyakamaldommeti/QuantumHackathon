import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  FileText,
  Clock,
  User,
  Star,
  Menu,
  X,
  Shield,
  Phone,
  Plus,
  Mic,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  imgSrc?: string;
  path: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'voice',
    label: 'Voice Mode',
    imgSrc: '/voice-mode-logo.png',
    path: '/',
    description: 'Hands-free assistance',
  },
  {
    id: 'chatbot',
    label: 'AI Chatbot',
    imgSrc: '/care-shield-chat-logo.png',
    path: '/chat',
    description: 'Voice & text first-aid assistance',
  },
  {
    id: 'summarizer',
    label: 'Info Summarizer',
    imgSrc: '/info-summarizer-logo.png',
    path: '/summarizer',
    description: 'Summarize medical documents',
  },
  {
    id: 'history',
    label: 'Chat History',
    imgSrc: '/chat-history-logo.png',
    path: '/history',
    description: 'View past conversations',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    imgSrc: '/feedback-logo.png',
    path: '/feedback',
    description: 'Share your thoughts',
  },
  {
    id: 'profile',
    label: 'My Profile',
    imgSrc: '/profile-logo.png',
    path: '/profile',
    description: 'Settings & preferences',
  },
  {
    id: 'emergency',
    label: 'Emergency SOS',
    imgSrc: '/warning-icon.png',
    path: '/emergency',
    description: 'Send alerts to contacts',
  },
];

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onToggle, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
    // Close on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -285,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-[350px] flex flex-col',
          'bg-sidebar border-r border-sidebar-border',
          'lg:translate-x-0 lg:static lg:z-auto',
          !isOpen && 'lg:translate-x-0'
        )}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-4">
            <img
              src="/care-shield-logo.png"
              alt="Care Shield Logo"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="font-bold text-xl text-sidebar-foreground">Care Shield</h1>
              <p className="text-sm text-muted-foreground">AI Healthcare Assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-5 space-y-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  item.id === 'emergency' && 'border-2 border-red-500',
                  active
                    ? 'accent-gradient text-white shadow-lg sidebar-active-glow'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    active ? 'bg-white/20' : 'bg-sidebar-accent'
                  )}
                >
                  {item.imgSrc ? (
                    <img src={item.imgSrc} alt={item.label} className="w-9 h-9 object-contain" />
                  ) : item.icon && (
                    <item.icon className={cn('h-6 w-6', active ? 'text-white' : 'text-primary')} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn('block font-semibold text-base', active && 'text-white')}>
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      'block text-sm truncate',
                      active ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {item.description}
                  </span>
                </div>
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-1.5 h-10 bg-white rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer with Version */}
        <div className="mt-auto border-t border-sidebar-border bg-sidebar">
          <div className="px-5 py-4 text-center">
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'fixed top-4 left-4 z-50 lg:hidden',
          'bg-sidebar border border-sidebar-border shadow-lg',
          isOpen && 'hidden'
        )}
        onClick={onToggle}
      >
        <Menu className="h-5 w-5 text-sidebar-foreground" />
      </Button>
    </>
  );
};
