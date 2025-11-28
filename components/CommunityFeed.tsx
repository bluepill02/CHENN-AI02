import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../services/LanguageService';
import { Star, Loader2 } from 'lucide-react';
import { CustomIcon } from './CustomIcons';
import { PremiumIcon } from './PremiumIcons';
import { useLocation, getLocationSpecificContent } from '../services/LocationService';
import { useExternalData } from '../services/ExternalDataService';
import { PostService, Post } from '../services/PostService';
import { AiService } from '../services/AiService';
import { useAuth } from './auth/SupabaseAuthProvider';
import { FeedScreenBackground, StaggerContainer, StaggerItem } from './BackgroundAnimations';

import { toast } from 'sonner';
import { PostSkeleton } from './SkeletonLoaders';
import AutoShareCard from './AutoShareCard';
import FoodHuntCard from './FoodHuntCard';
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

interface CommunityFeedProps {
  userLocation?: any;
}

export function CommunityFeed({ userLocation }: CommunityFeedProps) {
  const navigate = useNavigate();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { currentLocation, setLocationModalOpen } = useLocation();
  const { } = useExternalData(); // Removed unused weather
  const { } = useLanguage(); // Removed unused t
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // AI Summarization State
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});

  // Use location from context if available, otherwise use prop
  const activeLocation = currentLocation || userLocation;
  const activePincode = activeLocation?.pincode || '600004';

  // Get location-specific content
  const locationContent = getLocationSpecificContent(activeLocation);

  // Story highlights data
  const storyHighlights = [
    { id: 1, image: '/assets/icon_auto.png', title: 'Auto Share', isNew: true },
    { id: 2, image: '/assets/icon_food.png', title: 'Food Hunt', isNew: true },
    { id: 3, image: '/assets/hero_welcome.png', title: 'Chennai Gethu', isNew: false },
    { id: 4, image: '/assets/icon_info.png', title: 'Live Updates', isNew: true },
  ];

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, [activeLocation]);

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

  const handleLike = async (postId: string) => {
    try {
      // Optimistic update
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, likes: p.likes + 1, is_liked_by_user: true } : p
      ));

      await PostService.likePost(postId);
    } catch (error) {
      console.error('Failed to like post', error);
      fetchPosts();
    }
  };

  const handleSummarize = async (postId: string, content: string) => {
    if (summaries[postId]) return;

    setSummarizing(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await AiService.summarizePost(content);
      if (response.content) {
        setSummaries(prev => ({ ...prev, [postId]: response.content }));
        toast.success('Summary generated! ✨');
      } else {
        toast.error('Could not summarize this post');
      }
    } catch (error) {
      console.error('Summarization failed', error);
      toast.error('Failed to summarize');
    } finally {
      setSummarizing(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.profiles?.full_name || 'Community member'}`,
        text: post.content,
        url: window.location.href,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(post.content);
      toast.success('Post content copied to clipboard! 📋');
    }
  };

  // Filter posts based on active filter
  const filteredPosts = activeFilter
    ? posts.filter(post => post.category === activeFilter)
    : posts;

  const getPostBadge = (type: string | undefined) => {
    if (!type) return null;
    switch (type) {
      case 'food_recommendation':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1 text-xs">
            <PremiumIcon icon="Food" className="w-3 h-3" color="currentColor" />
            சாப்பாடு
          </Badge>
        );
      case 'community_event':
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1 text-xs">
            <PremiumIcon icon="Community" className="w-3 h-3" color="currentColor" />
            நிகழ்ச்சி
          </Badge>
        );
      case 'cultural_event':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1 text-xs">
            <PremiumIcon icon="Celebration" className="w-3 h-3" color="currentColor" />
            பண்டிகை
          </Badge>
        );
      case 'help_request':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 text-xs">
            <PremiumIcon icon="Auto" className="w-3 h-3" color="currentColor" />
            உதவி
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen relative overflow-hidden">
      {/* Premium animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <FeedScreenBackground />
      </div>

      {/* Header - Cinema Scope Style */}
      <motion.div
        className="bg-gradient-to-b from-auto-black to-black pb-8 pt-6 px-4 rounded-b-[2.5rem] relative overflow-hidden shadow-2xl border-b-4 border-auto-yellow z-20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {/* Film Grain Overlay */}
        <div className="absolute inset-0 film-grain opacity-20 pointer-events-none"></div>

        {/* Marquee Effect Background */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-auto-yellow overflow-hidden flex items-center">
          <motion.div
            className="whitespace-nowrap text-black font-display font-bold text-xs uppercase tracking-widest flex gap-8"
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(10)].map((_, i) => (
              <span key={i}>★ NOW SHOWING: CHENNAI SUPERHITS ★ {locationContent.greeting} ★</span>
            ))}
          </motion.div>
        </div>

        <div className="flex items-center justify-between relative z-10 mt-6">
          <div className="flex-1">
            <motion.h1
              className="text-auto-yellow text-4xl font-display font-bold drop-shadow-[0_2px_0_rgba(255,0,0,1)] tracking-wide"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {activeLocation ? activeLocation.area.toUpperCase() : 'CHENNAI'}
            </motion.h1>
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-temple-red text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border border-white/20">
                LIVE ACTION
              </div>
              <p className="text-gray-400 text-sm font-medium">
                {activeLocation?.pincode || '600004'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-auto-yellow hover:text-white hover:bg-white/10"
                onClick={() => setLocationModalOpen(true)}
              >
                <PremiumIcon icon="Location" className="w-4 h-4" color="currentColor" animated={false} />
              </Button>
            </motion.div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <motion.div
              className="w-12 h-12 bg-auto-yellow rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_15px_rgba(255,215,0,0.5)]"
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <PremiumIcon icon="Community" className="w-6 h-6" color="black" />
            </motion.div>
          </div>
        </div>

        {/* Quick stats - Ticket Stub Style */}
        <motion.div
          className="mt-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="bg-white/5 border-l-4 border-auto-yellow rounded-r-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm min-w-max"
            whileHover={{ scale: 1.05 }}
          >
            <Star className="w-4 h-4 text-auto-yellow fill-auto-yellow" />
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] uppercase">Trust Score</span>
              <span className="text-white text-sm font-bold font-display">4.8/5.0</span>
            </div>
          </motion.div>
          <motion.div
            className="bg-white/5 border-l-4 border-temple-red rounded-r-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm min-w-max"
            whileHover={{ scale: 1.05 }}
          >
            <PremiumIcon icon="Location" className="w-4 h-4 text-temple-red" color="currentColor" animated={false} />
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] uppercase">Radius</span>
              <span className="text-white text-sm font-bold font-display">2.3 KM</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Story Highlights */}
      <motion.div
        className="px-6 py-4 overflow-x-auto"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex gap-4 pb-2">
          {storyHighlights.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <StoryHighlight
                image={story.image}
                title={story.title}
                isNew={story.isNew}
                onClick={() => {
                  if (story.title === 'Auto Share') setActiveFilter(activeFilter === 'help_request' ? null : 'help_request');
                  else if (story.title === 'Food Hunt') setActiveFilter(activeFilter === 'food_recommendation' ? null : 'food_recommendation');
                  else if (story.title === 'Chennai Gethu') navigate('/chennai-gethu');
                  else if (story.title === 'Live Updates') navigate('/live');
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>



      {/* Content Area with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-6 space-y-4 pb-20">
          {activeFilter === 'help_request' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AutoShareCard pincode={activePincode} />
            </motion.div>
          ) : activeFilter === 'food_recommendation' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FoodHuntCard pincode={activePincode} />
            </motion.div>
          ) : (
            /* Default Community Posts */
            <>
              {loading ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : filteredPosts.length === 0 ? (
                <motion.div
                  className="text-center py-10 text-gray-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CustomIcon icon="Sparkles" className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                  <p className="text-lg font-medium">No posts yet</p>
                  <p className="text-sm">Be the first to share! 🎉</p>
                </motion.div>
              ) : (
                <StaggerContainer>
                  <AnimatePresence>
                    {filteredPosts.map((post, index) => (
                      <StaggerItem key={post.id} index={index}>
                        <AnimatedPostCard delay={0}>
                          <Card className="p-4 bg-white/80 backdrop-blur-md border border-orange-100 shadow-lg shadow-orange-100/50 rounded-[1.5rem] overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            {/* Post header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <motion.div
                                  className="relative flex-shrink-0"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  <Avatar className="w-10 h-10 border-2 border-orange-100">
                                    {post.profiles?.avatar_url ? (
                                      <img src={post.profiles.avatar_url} alt={post.profiles.full_name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">
                                          {post.profiles?.full_name ? post.profiles.full_name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                      </div>
                                    )}
                                  </Avatar>
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-[#4B1E1E] truncate">
                                      {post.profiles?.full_name || 'Anonymous'}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <CustomIcon icon="LocationPin" className="w-3 h-3 flex-shrink-0 text-orange-400" />
                                    <span className="truncate">{post.area || 'Chennai'}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="whitespace-nowrap">
                                      {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {getPostBadge(post.category)}
                              </div>
                            </div>

                            {/* Post content */}
                            <motion.p
                              className="text-[#4B1E1E] mb-3 leading-relaxed break-words text-[15px]"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              {post.content}
                            </motion.p>

                            {/* Post image */}
                            {post.image_url && (
                              <PostImageGallery images={[post.image_url]} />
                            )}

                            {/* AI Summary Section */}
                            <AnimatePresence>
                              {summaries[post.id] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mb-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 rounded-xl flex gap-2 items-start overflow-hidden"
                                >
                                  <CustomIcon icon="Sparkles" className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-gray-700 italic">{summaries[post.id]}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Post actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-4">
                                <AnimatedLikeButton
                                  isLiked={post.is_liked_by_user || false}
                                  count={post.likes}
                                  onClick={() => handleLike(post.id)}
                                  label="Podu Macha" // Custom label for Chennai vibe
                                />
                                <AnimatedCommentButton
                                  count={post.comments_count}
                                  onClick={() => toast.info('Comments feature coming soon! 💬')}
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
                                    <CustomIcon icon="Sparkles" className="w-4 h-4" />
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
              )}
            </>
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      {!activeFilter && (
        <FloatingActionButton onClick={() => setIsPostDialogOpen(true)} />
      )}

      {/* Create Post Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
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
    </div>
  );
}
