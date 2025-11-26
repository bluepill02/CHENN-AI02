import React, { useState, useEffect } from 'react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TamilKeyboard } from './TamilKeyboard';
import { IllustratedIcon, ChennaiIcons } from './IllustratedIcon';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../services/LanguageService';
import { MapPin, Send, ArrowLeft, Keyboard, Loader2 } from 'lucide-react';
import chatConversations from 'figma:asset/d802a9fc88d5797d4e698a0f07c361b2d87a1818.png';
import { ChatService, type Message } from '../services/ChatService';
import { useAuth } from './auth/SupabaseAuthProvider';
import { toast } from 'sonner';
import { ChatMessageSkeleton } from './SkeletonLoaders';

export function ChatScreen() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showTamilKeyboard, setShowTamilKeyboard] = useState(false);
  const { t } = useLanguage();

  // Hardcoded conversation list (can be fetched from DB in future)
  const conversations = [
    {
      id: 1,
      chat_id: 'group_mylapore_neighbors',
      type: 'group',
      name: 'Mylapore Neighbors',
      lastMessage: 'Anyone knows good electrician nearby?',
      time: '2 min',
      unread: 0,
      members: 47,
      isActive: true
    },
    {
      id: 2,
      chat_id: 'announcement_tnagar',
      type: 'announcement',
      name: 'T. Nagar Updates',
      lastMessage: 'Water supply will be affected tomorrow 10 AM - 2 PM',
      time: '1 hour',
      unread: 0,
      isOfficial: true
    },
    {
      id: 4,
      chat_id: 'group_beach_cleanup',
      type: 'group',
      name: 'Beach Cleanup Squad',
      lastMessage: 'Meeting at 6 AM tomorrow at Marina',
      time: '5 hours',
      unread: 0,
      members: 23,
      isActive: true
    },
  ];

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessages();

      // Subscribe to real-time updates
      const unsubscribe = ChatService.subscribeToChat(
        selectedChat.chat_id,
        (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [selectedChat]);

  const loadMessages = async () => {
    if (!selectedChat) return;

    try {
      setLoading(true);
      const data = await ChatService.getMessages(selectedChat.chat_id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedChat) return;

    try {
      setSending(true);
      await ChatService.sendMessage(
        newMessage.trim(),
        selectedChat.chat_id,
        user.id
      );

      setNewMessage('');
      setShowTamilKeyboard(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getConversationIcon = (conversation: any) => {
    if (conversation.type === 'group') {
      return (
        <IllustratedIcon
          src={ChennaiIcons.group}
          alt="Group Chat"
          size="md"
          fallbackEmoji="👥"
          style="circular"
        />
      );
    }

    if (conversation.type === 'announcement') {
      return (
        <IllustratedIcon
          src={ChennaiIcons.announcement}
          alt="Announcement"
          size="md"
          fallbackEmoji="📢"
          style="circular"
        />
      );
    }

    return (
      <Avatar className="w-12 h-12">
        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">{conversation.name.split(' ').map((n: string) => n[0]).join('')}</span>
        </div>
      </Avatar>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const quickActions = [
    {
      iconSrc: ChennaiIcons.group,
      iconEmoji: '👥',
      label: 'Join Groups',
      color: 'from-blue-400 to-purple-500'
    },
    {
      iconSrc: ChennaiIcons.chat,
      iconEmoji: '💬',
      label: 'Start Chat',
      color: 'from-green-400 to-teal-500'
    },
    {
      iconSrc: ChennaiIcons.announcement,
      iconEmoji: '📢',
      label: 'Announcements',
      color: 'from-red-400 to-pink-500'
    }
  ];

  // Chat Detail View
  if (selectedChat) {
    return (
      <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen flex flex-col relative">
        {/* Chat conversations background */}
        <div className="fixed inset-0 opacity-12 md:opacity-8 pointer-events-none">
          <ImageWithFallback
            src={chatConversations}
            alt="Chennai Chat Conversations"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-4 flex items-center gap-3">
            <Button
              onClick={() => setSelectedChat(null)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3 flex-1">
              {getConversationIcon(selectedChat)}
              <div>
                <h1 className="text-white font-medium">{selectedChat.name}</h1>
                <p className="text-orange-100 text-sm">
                  {selectedChat.members ? `${selectedChat.members} members` : 'Group chat'}
                  {selectedChat.isActive && ' • Active now'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            {loading ? (
              <>
                <ChatMessageSkeleton />
                <ChatMessageSkeleton />
                <ChatMessageSkeleton />
                <ChatMessageSkeleton />
              </>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = user?.id === message.sender_id;

                return (
                  <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isMe
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                      : 'bg-card backdrop-blur-sm border border-orange-200 shadow-md'
                      }`}>
                      {!isMe && (
                        <p className="text-xs font-medium text-orange-600 mb-1">
                          {message.profiles?.full_name || 'User'}
                        </p>
                      )}
                      <p className={`text-sm ${isMe ? 'text-white' : 'text-gray-800'}`}>
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-orange-100' : 'text-gray-500'}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white/95 backdrop-blur-sm border-t border-orange-100 p-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowTamilKeyboard(!showTamilKeyboard)}
                variant="outline"
                size="sm"
                className={`border-orange-200 ${showTamilKeyboard ? 'bg-orange-100 text-orange-700' : ''}`}
              >
                <Keyboard className="w-4 h-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message... • உங்கள் message-ஐ type பண்ணுங்க..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                disabled={!user || sending}
              />
              <Button
                onClick={sendMessage}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!newMessage.trim() || !user || sending}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-gray-500 mt-2">Sign in to send messages</p>
            )}
          </div>

          {/* Tamil Keyboard */}
          <TamilKeyboard
            onTextChange={setNewMessage}
            currentText={newMessage}
            isVisible={showTamilKeyboard}
            onToggle={() => setShowTamilKeyboard(!showTamilKeyboard)}
          />
        </div>
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen relative">
      {/* Chat conversations background */}
      <div className="fixed inset-0 opacity-15 md:opacity-10 pointer-events-none">
        <ImageWithFallback
          src={chatConversations}
          alt="Chennai Chat Conversations"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-6 rounded-b-[2rem]">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white text-2xl font-bold">{t('chat.title', 'Chat')}</h1>
            <LanguageToggle />
          </div>
          <p className="text-orange-100">{t('chat.subtitle', 'Stay connected with your community')}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-yellow-200 text-xs">💬 {t('chat.keyboard', 'Tamil keyboard supported')}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-6 py-4">
          <div className="flex gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="flex-1 h-auto p-3 flex-col gap-2 border-orange-200 hover:bg-orange-50"
              >
                <IllustratedIcon
                  src={action.iconSrc}
                  alt={action.label}
                  size="sm"
                  fallbackEmoji={action.iconEmoji}
                  style="rounded"
                />
                <span className="text-xs text-gray-600">{action.label}</span>
              </Button>
            ))
            }
          </div>
        </div>

        {/* Conversations list */}
        <div className="px-6 pb-20">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="p-4 bg-card backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] shadow-orange-100/50"
                onClick={() => setSelectedChat(conversation)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar/Icon */}
                  <div className="relative">
                    {getConversationIcon(conversation)}
                    {conversation.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Conversation details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{conversation.name}</h3>
                        {conversation.isOfficial && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                            ✓ Official
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{conversation.time}</span>
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-1">{conversation.lastMessage}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {conversation.members && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">👥</span>
                            <span className="text-xs text-gray-500">{conversation.members} members</span>
                          </div>
                        )}
                      </div>

                      {conversation.unread > 0 && (
                        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">{conversation.unread}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}