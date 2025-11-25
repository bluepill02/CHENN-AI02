import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Post, PostService } from './PostService';
import { AiService } from './AiService';

export interface LivePost {
  id: string;
  content: string;
  category: string;
  categoryEn: string;
  timestamp: Date;
  user: {
    name: string;
    isVerified: boolean;
    trustScore: number;
  };
  location: {
    area: string;
    areaEn: string;
    pincode: string;
  };
  likes: number;
  comments: number;
  isUrgent?: boolean;
  isRead?: boolean;
}

export interface LiveAlert {
  id: string;
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  source: string;
  affectedAreas?: string[];
  isActive: boolean;
}

interface RealTimeDataContextType {
  posts: LivePost[];
  alerts: LiveAlert[];
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  postsCount: number;
  simulateNewPost: (postData: Partial<LivePost>) => void;
  markPostAsRead: (postId: string) => void;
  addAlert: (alert: Partial<LiveAlert>) => void;
  dismissAlert: (alertId: string) => void;
}

const RealTimeDataContext = createContext<RealTimeDataContextType | undefined>(undefined);

interface RealTimeDataProviderProps {
  children: ReactNode;
}
export function RealTimeDataProvider({ children }: RealTimeDataProviderProps) {
  const [posts, setPosts] = useState<LivePost[]>([]);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());

  const fetchCommunityPosts = async () => {
    setConnectionStatus('connecting');
    try {
      const dbPosts = await PostService.getPosts();
      const livePosts: LivePost[] = dbPosts.map((p: Post) => ({
        id: p.id,
        content: p.content,
        category: p.category || 'Update',
        categoryEn: p.category || 'Update',
        timestamp: new Date(p.created_at),
        user: {
          name: p.profiles?.full_name || 'Community Member',
          isVerified: true,
          trustScore: 80,
        },
        location: {
          area: p.area || 'Chennai',
          areaEn: p.area || 'Chennai',
          pincode: '',
        },
        likes: p.likes,
        comments: p.comments_count,
        isRead: false,
      }));
      setPosts(livePosts);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to fetch community posts:', error);
      setConnectionStatus('error');
    }
  };

  const fetchRealTimeAlerts = async () => {
    try {
      const area = localStorage.getItem('user_area') || 'Chennai';

      const result = await AiService.chat(`
        Search the web for CRITICAL and URGENT alerts for residents in ${area}, Chennai RIGHT NOW.
        Examples: severe weather warnings, major road closures, public safety announcements, health alerts.
        If there are no critical alerts, return a JSON object with an empty "alerts" array.

        Return as JSON with this exact structure: { "alerts": [{ "id": "unique_id", "title": "...", "message": "...", "severity": "high" | "critical", "source": "Official Source" }] }
      `);

      if (result.content) {
        try {
          const parsed = JSON.parse(result.content);
          if (parsed.alerts && parsed.alerts.length > 0) {
            const newAlerts = parsed.alerts.map((a: Partial<LiveAlert>, index: number) => ({
              id: a.id || `alert_${Date.now()}_${index}`,
              title: a.title || 'Urgent Alert',
              titleEn: a.titleEn || a.title || 'Urgent Alert',
              message: a.message || 'No details available.',
              messageEn: a.messageEn || a.message || 'No details available.',
              severity: a.severity || 'high',
              timestamp: new Date(),
              source: a.source || 'Official Source',
              affectedAreas: [area],
              isActive: true,
            }));
            setAlerts(newAlerts);
          }
        } catch (error) {
          console.error('Failed to parse real-time alerts JSON:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch real-time alerts:', error);
    }
  };

  // Fetch data on initial load and then periodically
  useEffect(() => {
    fetchCommunityPosts();
    fetchRealTimeAlerts();

    // Refresh posts every 2 minutes
    const postInterval = setInterval(fetchCommunityPosts, 2 * 60 * 1000);
    // Refresh alerts every 15 minutes
    const alertInterval = setInterval(fetchRealTimeAlerts, 15 * 60 * 1000);

    return () => {
      clearInterval(postInterval);
      clearInterval(alertInterval);
    };
  }, []);

  const simulateNewPost = (postData: Partial<LivePost>) => {
    // This function is now only for optimistic UI updates if needed in the future
    // For now, it's a no-op
  };

  const markPostAsRead = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, isRead: true } : post
      )
    );
  };

  const addAlert = (alertData: Partial<LiveAlert>) => {
    // This function is now only for optimistic UI updates if needed in the future
    // For now, it's a no-op
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, isActive: false } : alert
      ).filter(alert => alert.isActive)
    );
  };

  const value: RealTimeDataContextType = {
    posts,
    alerts: alerts.filter(alert => alert.isActive),
    isConnected,
    connectionStatus,
    lastUpdate,
    postsCount: posts.length,
    simulateNewPost,
    markPostAsRead,
    addAlert,
    dismissAlert
  };

  return (
    <RealTimeDataContext.Provider value={value}>
      {children}
    </RealTimeDataContext.Provider>
  );
}

export function useRealTimeData() {
  const context = useContext(RealTimeDataContext);
  if (context === undefined) {
    throw new Error('useRealTimeData must be used within a RealTimeDataProvider');
  }
  return context;
}

// Utility functions for time formatting
export function getRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function getRelativeTimeTamil(timestamp: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'இப்போது';
  if (diffInMinutes < 60) return `${diffInMinutes} நிமிடங்கள் முன்`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} மணிநேரம் முன்`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} நாட்கள் முன்`;
}