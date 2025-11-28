import React, { useState, useEffect } from 'react';
import { useAuth } from './auth/SupabaseAuthProvider';
import { useLanguage } from '../services/LanguageService';
import { ChatService, Message } from '../services/ChatService';
import { toast } from 'sonner';
import { Users, MessageCircle, Megaphone, Keyboard, Loader2, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { TamilKeyboard } from './TamilKeyboard';
import { LanguageToggle } from './LanguageToggle';
import { ChatMessageSkeleton } from './SkeletonLoaders';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export function ChatScreen() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showTamilKeyboard, setShowTamilKeyboard] = useState(false);
  const { t } = useLanguage();

  // Conversations State
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Create Group State
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);

      // Subscribe to new messages (mock for now, real-time later)
      const interval = setInterval(() => {
        loadMessages(selectedChat.id, true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const data = await ChatService.getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations', error);
      toast.error('Failed to load chats');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (chatId: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ChatService.getMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedChat) return;
    setSending(true);
    try {
      await ChatService.sendMessage(selectedChat.id, user.id, newMessage.trim());
      setNewMessage('');
      loadMessages(selectedChat.id, true);
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    setCreatingGroup(true);
    try {
      await ChatService.createGroup(newGroupName, newGroupDesc, user.id, true); // Defaulting to public for community groups
      toast.success('Group created successfully!');
      setIsCreateGroupOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      loadConversations();
    } catch (error) {
      console.error('Failed to create group', error);
      toast.error('Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const getConversationIcon = (conversation: any) => {
    if (conversation.is_group) {
      return <Users className="w-10 h-10 text-orange-500 bg-orange-100 p-2 rounded-full" />;
    }
    return (
      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
        <AvatarImage src={conversation.avatar_url} />
        <AvatarFallback>{conversation.name?.[0]}</AvatarFallback>
      </Avatar>
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickActions = [
    {
      icon: Users,
      label: 'Join Groups',
      color: 'text-blue-600 bg-blue-100',
      action: () => toast.info('Browse Groups coming soon!')
    },
    {
      icon: MessageCircle,
      label: 'Start Chat',
      color: 'text-green-600 bg-green-100',
      action: () => toast.info('User search coming soon!')
    },
    {
      icon: Megaphone,
      label: 'Create Group',
      color: 'text-red-600 bg-red-100',
      action: () => setIsCreateGroupOpen(true)
    }
  ];

  // Chat Detail View (existing code)
  if (selectedChat) {
    // ... (existing chat detail view)
    return (
      <div className="bg-gradient-to-b from-orange-50 to-yellow-25 h-full flex flex-col relative">
        {/* ... (existing chat detail content) */}

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

        {/* Message Input (existing code) */}
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
                onClick={action.action}
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
            {loadingConversations ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-400" />
                <p>Loading chats...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No conversations yet.</p>
                <Button variant="link" onClick={() => setIsCreateGroupOpen(true)} className="text-orange-600">
                  Create a Group
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => (
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
                          <h3 className="font-medium text-gray-900 truncate">{conversation.name || 'Unnamed Chat'}</h3>
                          {conversation.is_public && ( // Changed from isOfficial to is_public for now
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {conversation.time ? formatTime(conversation.time) : ''}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 truncate mb-1">{conversation.lastMessage}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Members count if available */}
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input id="name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Mylapore Runners" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="What's this group about?" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateGroup} disabled={creatingGroup} className="bg-orange-500 hover:bg-orange-600 text-white">
              {creatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}