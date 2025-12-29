import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  AlertTriangle,
  MessageCircle,
  Trash2,
  ChevronRight,
  Search,
  Calendar,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/layout/Footer';

interface ChatHistoryItem {
  id: string;
  date: Date;
  preview: string;
  isEmergency: boolean;
  messageCount: number;
}

const formatDate = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

const HistoryPage = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch conversations from MongoDB on component mount
  React.useEffect(() => {
    if (authLoading) return;

    const fetchHistory = async () => {
      try {
        const userId = user?.uid || 'anonymous';
        const response = await fetch(`http://localhost:3001/api/conversations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          // ...
          setHistory(data.map((item: any) => ({
            id: item.id,
            date: new Date(item.date),
            preview: item.preview,
            isEmergency: item.isEmergency,
            messageCount: item.messageCount
          })));
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item =>
    item.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://localhost:3001/api/conversations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        toast({
          title: "Chat deleted",
          description: "The conversation has been removed from your history.",
        });
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  const handleClearAllHistory = async () => {
    if (!history.length) return;

    if (!window.confirm("Are you sure you want to delete ALL chat history? This cannot be undone.")) {
      return;
    }

    try {
      const userId = user?.uid || 'anonymous';
      const response = await fetch(`http://localhost:3001/api/conversations?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setHistory([]); // Clear local state
        toast({
          title: "History Cleared",
          description: "All conversations have been permanently deleted.",
        });
      } else {
        throw new Error('Failed to delete history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive"
      });
    }
  };

  const handleChatClick = (id: string) => {
    setSelectedChat(id);
    navigate(`/chat?conversationId=${id}`);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 ml-12 lg:ml-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <img src="/chat-history-logo.png" alt="Chat History" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Chat History</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{history.length} conversations</p>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-3xl mx-auto">
          {/* Search and Clear Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10 h-12"
              />
            </div>
            {history.length > 0 && (
              <Button
                variant="outline"
                className="h-12 border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
                onClick={handleClearAllHistory}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {/* History List */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleChatClick(item.id)}
                    className={`bg-card border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg ${selectedChat === item.id ? 'border-primary ring-2 ring-primary/20' : ''
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.isEmergency ? 'bg-emergency/20' : 'bg-primary/20'
                        }`}>
                        {item.isEmergency ? (
                          <AlertTriangle className="h-5 w-5 text-emergency" />
                        ) : (
                          <MessageCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.isEmergency && (
                            <Badge variant="destructive" className="text-xs">
                              Emergency
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <p className="text-foreground line-clamp-2 text-sm">
                          {item.preview}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.messageCount} messages
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emergency"
                          onClick={(e) => handleDeleteChat(item.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No conversations found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try a different search term.' : 'Start a new chat to see your history here.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HistoryPage;
