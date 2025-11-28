import { useState, useEffect } from 'react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TamilKeyboard } from './TamilKeyboard';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../services/LanguageService';
import { Send, ArrowLeft, Keyboard, Loader2, Users, Megaphone, MessageCircle } from 'lucide-react';
import { CustomIcon } from './CustomIcons';
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
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
      );
    }

    if (conversation.type === 'announcement') {
      return (
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <Megaphone className="w-6 h-6 text-red-600" />
        </div>
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
      icon: Users,
      label: 'Join Groups',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: MessageCircle,
      label: 'Start Chat',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: Megaphone,
      label: 'Announcements',
      color: 'text-red-600 bg-red-100'
    }
  ];

  // Chat Detail View
  if (selectedChat) {
    return (
      <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen flex flex-col relative">
        {/* Chat conversations background */}
        <div className="fixed inset-0 opacity-12 md:opacity-8 pointer-events-none">
          <img
            src="/assets/bg_community.png"
            alt="Chennai Chat Conversations"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Chat Header - Cinema Style */}
          <div className="bg-gradient-to-r from-auto-black to-black px-4 py-4 flex items-center gap-3 border-b-4 border-auto-yellow shadow-lg relative overflow-hidden">
            {/* Film Grain Overlay */}
            <div className="absolute inset-0 film-grain opacity-20 pointer-events-none"></div>

            <Button
              onClick={() => setSelectedChat(null)}
              variant="ghost"
              size="sm"
              className="text-auto-yellow hover:text-white hover:bg-white/10 p-2 relative z-10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <div className="flex items-center gap-3 flex-1 relative z-10">
              <div className="relative">
                {getConversationIcon(selectedChat)}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-white font-display font-bold tracking-wide text-lg">{selectedChat.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge className="bg-auto-yellow text-black text-[10px] font-bold px-1.5 py-0 border-none">
                    LIVE
                  </Badge>
                  <p className="text-gray-400 text-xs font-mono">
                    {selectedChat.members ? `${selectedChat.members} MEMBERS` : 'PRIVATE CHAT'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <Button variant="ghost" size="icon" className="text-auto-yellow hover:bg-white/10">
                <CustomIcon icon="FilterCoffee" className="w-6 h-6" />
              </Button>
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
                  <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={`max-w-[80%] lg:max-w-md px-4 py-3 relative ${isMe
                      ? 'bg-auto-yellow text-black rounded-l-2xl rounded-tr-2xl rounded-br-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black'
                      : 'bg-white text-black rounded-r-2xl rounded-tl-2xl rounded-bl-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black'
                      }`}>
                      {!isMe && (
                        <p className="text-xs font-bold text-temple-red mb-1 uppercase tracking-wider">
                          {message.profiles?.full_name || 'User'}
                        </p>
                      )}
                      <p className={`text-sm font-medium leading-relaxed ${isMe ? 'text-black' : 'text-gray-900'}`}>
                        {message.content}
                      </p>
                      <p className={`text-[10px] mt-1 font-bold text-right ${isMe ? 'text-black/60' : 'text-gray-400'}`}>
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
        <img
          src="/assets/bg_community.png"
          alt="Chennai Chat Conversations"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-6 rounded-b-[2rem]">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white text-2xl font-display font-bold">{t('chat.title', 'Chat')}</h1>
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
                onClick={() => {
                  toast.info(`${action.label} feature coming soon!`);
                }}
              >
                <action.icon className={`w-6 h-6 ${action.color.split(' ')[0]}`} />
                <span className="text-xs text-gray-600">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Conversations list */}
        <div className="px-6 pb-20">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] hover:shadow-[6px_6px_0px_0px_rgba(234,88,12,1)] transition-all cursor-pointer hover:scale-[1.02] relative overflow-hidden group"
                onClick={() => setSelectedChat(conversation)}
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply z-0" style={{ backgroundImage: 'url("/assets/noise.png")', backgroundRepeat: 'repeat' }}></div>
                <div className="relative z-10 flex items-center gap-3">
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