import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../services/LanguageService';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { CustomIcon, ChennaiCustomIcons } from './CustomIcons';
import { useLocation } from '../services/LocationService';
import { useExternalData } from '../services/ExternalDataService';
import { PostService, Post } from '../services/PostService';
import { AiService } from '../services/AiService';
import { useAuth } from './auth/SupabaseAuthProvider';
import { FeedScreenBackground, StaggerContainer, StaggerItem } from './BackgroundAnimations';

import { toast } from 'sonner';
import { PostSkeleton } from './SkeletonLoaders';
import AutoShareCard from './AutoShareCard';
import FoodHuntCard from './FoodHuntCard';
import TransportCard from './TransportCard';
import {
  AnimatedPostCard,
  AnimatedLikeButton,
  FloatingActionButton,
  PullToRefresh,
  StoryHighlight,
  AnimatedCommentButton,
  AnimatedShareButton,
  PostImageGallery,
} from './FeedAnimationComponents';
import { WeatherService, WeatherData } from '../services/WeatherService';

interface CommunityFeedProps {
  userLocation?: any;
}

export function CommunityFeed({ userLocation }: CommunityFeedProps) {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const { currentLocation } = useLocation();
  const { } = useExternalData();
  const { } = useLanguage();
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [liveUpdate, setLiveUpdate] = useState<string>('');

  // AI Summarization State
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});

  // Use location from context if available, otherwise use prop
  const activeLocation = currentLocation || userLocation;
  const activePincode = activeLocation?.pincode || '600004';

  const [activeView, setActiveView] = useState<'feed' | 'auto-share' | 'food-hunt' | 'commute'>('feed');
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Story highlights data
  // Story highlights data
  const storyHighlights: {
    id: number;
    image?: string;
    icon?: keyof typeof ChennaiCustomIcons;
    title: string;
    isNew: boolean;
  }[] = [
      { id: 1, image: '/assets/icon_auto.png', title: 'Auto Share', isNew: true },
      { id: 2, image: '/assets/icon_food.png', title: 'Food Hunt', isNew: true },
      { id: 3, image: '/assets/icon_bus.png', title: 'Commute', isNew: true },
      { id: 4, image: '/assets/hero_welcome.png', title: 'Chennai Gethu', isNew: false },
      { id: 5, image: '/assets/icon_info.png', title: 'Info', isNew: false },
    ];

  // Fetch posts and weather
  useEffect(() => {
    fetchPosts();
    fetchWeather();
  }, [activeLocation]);

  const handleStoryClick = async (title: string) => {
    if (title === 'Info') {
      setIsInfoDialogOpen(true);
      if (!liveUpdate) {
        setLoadingInfo(true);
        const update = await AiService.getLiveUpdates(activeLocation?.area || 'Chennai');
        setLiveUpdate(update);
        setLoadingInfo(false);
      }
    } else if (title === 'Auto Share') {
      setActiveView('auto-share');
    } else if (title === 'Food Hunt') {
      setActiveView('food-hunt');
    } else if (title === 'Commute') {
      setActiveView('commute');
    } else if (title === 'Chennai Gethu') {
      // Navigate to Chennai Gethu page
      window.location.href = '/chennai-gethu'; // Using window.location for now as navigate hook usage might need verification or use existing router
    } else {
      toast.info(`${title} coming soon!`);
    }
  };

  const fetchWeather = async () => {
    if (activeLocation?.latitude && activeLocation?.longitude) {
      const data = await WeatherService.getWeather(activeLocation.latitude, activeLocation.longitude);
      setWeather(data);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Pass the area to filter posts by location
      const area = activeLocation?.area;
      const data = await PostService.getPosts(area);
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchPosts();
    toast.success('Feed refreshed! 🎉');
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast.error('Please sign in to post');
      return;
    }
    if (!newPostContent.trim()) return;

    setIsPosting(true);
    try {
      const area = activeLocation?.area || 'Chennai';
      const category = 'general';

      const newPost = await PostService.createPost(newPostContent, category, area, user.id);

      if (newPost) {
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setIsPostDialogOpen(false);
        toast.success('Post created successfully! 🎉');
      }
    } catch (error) {
      console.error('Failed to create post', error);
      toast.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  // Comments State
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    try {
      // Optimistic update
      setPosts(posts.map(p =>
        p.id === postId ? {
          ...p,
          likes: (p.is_liked_by_user ? p.likes - 1 : p.likes + 1),
          is_liked_by_user: !p.is_liked_by_user
        } : p
      ));

      await PostService.likePost(postId, user.id);
    } catch (error) {
      console.error('Failed to like post', error);
      fetchPosts(); // Revert on error
    }
  };

  const openComments = async (postId: string) => {
    setSelectedPostId(postId);
    setIsCommentsOpen(true);
    setLoadingComments(true);
    try {
      const data = await PostService.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments', error);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !selectedPostId || !newComment.trim()) return;

    try {
      const comment = await PostService.addComment(selectedPostId, user.id, newComment.trim());
      setComments([...comments, comment]);
      setNewComment('');

      // Update comment count in post list
      setPosts(posts.map(p =>
        p.id === selectedPostId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));

      toast.success('Comment added!');
    } catch (error) {
      console.error('Failed to add comment', error);
      toast.error('Failed to add comment');
    }
  };

  const handleSummarize = async (postId: string, content: string) => {
    setSummarizing(prev => ({ ...prev, [postId]: true }));
    try {
      const summary = await AiService.summarizePost(content);
      setSummaries(prev => ({ ...prev, [postId]: summary.content }));
    } catch (error) {
      console.error('Failed to summarize', error);
      toast.error('Failed to summarize post');
    } finally {
      setSummarizing(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on Chennai Community App',
        text: post.content,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${window.location.href}`);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen relative overflow-hidden">
      {/* ... (existing background and header) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FeedScreenBackground />
      </div>

      <div className="relative z-10 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/assets/kolam-pattern.png')] opacity-10 mix-blend-overlay"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                  Chennai Community
                </span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white drop-shadow-md flex items-center gap-2">
                <img src="/assets/app_logo.png" alt="Logo" className="w-8 h-8 rounded-full border-2 border-white/20" />
                Namma Ooru <span className="animate-pulse">🧡</span>
              </h1>
            </div>
            <LanguageToggle />
          </div>

          {/* Location & Weather */}
          <div className="flex items-center gap-3 text-orange-50 bg-black/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5">
              <CustomIcon icon="LocationPin" className="w-4 h-4 text-yellow-300" />
              <span className="font-medium text-sm">{activeLocation?.area || 'Chennai'}</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="flex items-center gap-1.5">
              {weather ? (
                <>
                  <span className="text-lg">{weather.icon}</span>
                  <span className="font-medium text-sm">{weather.temperature}°C</span>
                </>
              ) : (
                <span className="text-xs opacity-70">Loading weather...</span>
              )}
            </div>
          </div>
        </div>

        {/* Stories / Highlights */}
        <div className="px-6 mt-6 mb-2">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {storyHighlights.map((story) => (
              <StoryHighlight
                key={story.id}
                {...story}
                onClick={() => handleStoryClick(story.title)}
              />
            ))}
          </div>
        </div>

        {activeView === 'feed' && (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="px-4 space-y-6 min-h-[50vh]">
              {loading ? (
                <div className="space-y-4">
                  <PostSkeleton />
                  <PostSkeleton />
                </div>
              ) : (
                <>
                  {/* Posts Feed */}
                  <StaggerContainer>
                    <AnimatePresence>
                      {posts.map((post) => (
                        <StaggerItem key={post.id}>
                          <AnimatedPostCard>
                            <Card className="overflow-hidden border-none shadow-lg bg-white/90 backdrop-blur-sm">
                              {/* Post Header */}
                              <div className="p-4 flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-orange-100">
                                  {post.profiles?.avatar_url ? (
                                    <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 font-bold">
                                      {post.profiles?.full_name?.[0] || 'U'}
                                    </div>
                                  )}
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">{post.profiles?.full_name || 'Anonymous'}</h3>
                                    <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-700 hover:bg-orange-100">
                                      {post.category}
                                    </Badge>
                                    {post.area && (
                                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                        <CustomIcon icon="LocationPin" className="w-3 h-3" />
                                        {post.area}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Post Content */}
                              <div className="px-4 pb-2">
                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                                {/* AI Summary */}
                                {summaries[post.id] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-100 text-sm text-purple-800"
                                  >
                                    <div className="flex items-center gap-2 mb-1 font-bold text-xs uppercase tracking-wider">
                                      <CustomIcon icon="Sparkles" className="w-3 h-3" />
                                      AI Summary
                                    </div>
                                    {summaries[post.id]}
                                  </motion.div>
                                )}
                              </div>

                              {/* Post Image */}
                              {post.image_url && (
                                <div className="mt-2">
                                  <PostImageGallery images={[post.image_url]} />
                                </div>
                              )}

                              {/* Post Actions */}
                              <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                  <AnimatedLikeButton
                                    isLiked={post.is_liked_by_user || false}
                                    count={post.likes}
                                    onClick={() => handleLike(post.id)}
                                    label="Podu Macha"
                                  />
                                  <AnimatedCommentButton
                                    count={post.comments_count}
                                    onClick={() => openComments(post.id)}
                                  />
                                  <motion.button
                                    className="flex items-center gap-2 text-gray-500 hover:text-purple-500 transition-colors"
                                    onClick={() => handleSummarize(post.id, post.content)}
                                    disabled={summarizing[post.id]}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {summarizing[post.id] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                    <span className="text-sm hidden sm:inline font-medium">AI Summary</span>
                                  </motion.button>
                                </div>
                                <AnimatedShareButton onClick={() => handleShare(post)} />
                              </div>
                            </Card>
                          </AnimatedPostCard>
                        </StaggerItem>
                      ))}
                    </AnimatePresence>
                  </StaggerContainer>
                </>
              )}
            </div>
          </PullToRefresh>
        )}

        {activeView === 'auto-share' && (
          <div className="px-4 mt-4 min-h-[50vh]">
            <Button
              variant="ghost"
              onClick={() => setActiveView('feed')}
              className="mb-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
            <AutoShareCard pincode={activePincode} />
          </div>
        )}

        {activeView === 'food-hunt' && (
          <div className="px-4 mt-4 min-h-[50vh]">
            <Button
              variant="ghost"
              onClick={() => setActiveView('feed')}
              className="mb-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
            <FoodHuntCard pincode={activePincode} />
          </div>
        )}

        {activeView === 'commute' && (
          <div className="px-4 mt-4 min-h-[50vh]">
            <Button
              variant="ghost"
              onClick={() => setActiveView('feed')}
              className="mb-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
            <TransportCard pincode={activePincode} />
          </div>
        )}

        {/* Floating Action Button - Only show on feed view */}
        {activeView === 'feed' && (
          <FloatingActionButton onClick={() => setIsPostDialogOpen(true)} />
        )}

        {/* Create Post Dialog */}
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          {/* ... (existing dialog content) */}
          <DialogContent className="sm:max-w-[425px] bg-[#FFFFF0] border-orange-200 rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-[#4B1E1E] flex items-center gap-2 text-xl font-bold">
                <CustomIcon icon="Sparkles" className="w-6 h-6 text-orange-500" />
                Create New Post
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="Share what's happening in your neighborhood... 🏘️"
                className="min-h-[120px] border-orange-200 focus-visible:ring-orange-400 bg-white rounded-xl resize-none"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPostDialogOpen(false)}
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl"
                >
                  Cancel
                </Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 rounded-xl shadow-lg shadow-orange-200"
                    onClick={handleCreatePost}
                    disabled={isPosting || !newPostContent.trim()}
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <CustomIcon icon="Sparkles" className="w-4 h-4 mr-2 text-white" />
                        Post 🚀
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comments Dialog */}
        <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0 bg-[#fffdf5] overflow-hidden rounded-2xl">
            <div className="p-4 border-b border-orange-100 bg-white/50 backdrop-blur-sm">
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">💬</span> Comments
              </DialogTitle>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  No comments yet. Be the first!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-orange-100">
                      {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} alt={comment.profiles.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                          {comment.profiles?.full_name?.[0] || 'U'}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none border border-orange-50 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-900">{comment.profiles?.full_name || 'User'}</span>
                        <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-white border-t border-orange-100">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[40px] max-h-[100px] resize-none border-orange-200 focus-visible:ring-orange-400"
                />
                <Button
                  size="icon"
                  className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Dialog */}
        <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white border-orange-200 rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-[#4B1E1E] flex items-center gap-2 text-xl font-bold">
                <CustomIcon icon="Sparkles" className="w-6 h-6 text-orange-500" />
                Live Updates ({activeLocation?.area || 'Chennai'})
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {loadingInfo ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <p className="text-sm text-gray-500">Fetching latest updates...</p>
                </div>
              ) : (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {liveUpdate || "No updates available at the moment. Stay safe! 🙏"}
                  </p>
                  <div className="mt-2 text-[10px] text-gray-400 text-right">
                    Powered by Gemini ⚡
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
