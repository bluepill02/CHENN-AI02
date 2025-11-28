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
import { Star, Loader2, Sparkles } from 'lucide-react';
import { ChennaiCustomIcons, CustomIcon } from './CustomIcons';
import { useLocation, getLocationSpecificContent } from '../services/LocationService';
import { useExternalData } from '../services/ExternalDataService';
import { PostService, Post } from '../services/PostService';
import { AiService } from '../services/AiService';
import { useAuth } from './auth/SupabaseAuthProvider';

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
  const { weather } = useExternalData();
  const { t } = useLanguage();
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
    { id: 3, image: '/assets/hero_welcome.png', title: 'Events', isNew: false },
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
            <CustomIcon icon="Idli" className="w-3 h-3" />
            சாப்பாடு
          </Badge>
        );
      case 'community_event':
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 flex items-center gap-1 text-xs">
            <CustomIcon icon="Community" className="w-3 h-3" />
            நிகழ்ச்சி
          </Badge>
        );
      case 'cultural_event':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 flex items-center gap-1 text-xs">
            <CustomIcon icon="Temple" className="w-3 h-3" />
            பண்டிகை
          </Badge>
        );
      case 'help_request':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 text-xs">
            <CustomIcon icon="AutoRickshaw" className="w-3 h-3" />
            உதவி
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen relative">
      {/* Community scenes background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none overflow-hidden">
        <img
          src="/assets/bg_community.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Large decorative Kolams */}
        <div className="absolute -top-20 -right-20 w-96 h-96 text-orange-500/10 animate-spin-slow">
          <ChennaiCustomIcons.KolamPattern className="w-full h-full" />
        </div>
        <div className="absolute top-1/3 -left-20 w-64 h-64 text-red-500/5 animate-spin-reverse-slow">
          <ChennaiCustomIcons.KolamPattern className="w-full h-full" />
        </div>
      </div>

      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-6 rounded-b-[2rem] relative overflow-hidden shadow-lg"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {/* Traditional pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <ChennaiCustomIcons.KolamPattern className="w-full h-full text-white opacity-20" />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1">
            <motion.h1
              className="text-white text-2xl font-bold drop-shadow-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t('feed.title', locationContent.greeting)}
            </motion.h1>
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-orange-100 font-medium">
                {activeLocation ? `${activeLocation.area} • ${activeLocation.pincode}` : 'Mylapore • மயிலாப்பூர்'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-orange-200 hover:text-white hover:bg-white/10"
                onClick={() => setLocationModalOpen(true)}
              >
                <CustomIcon icon="LocationPin" className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div
              className="flex items-center gap-2 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {activeLocation && (
                <>
                  <CustomIcon icon="CheckCircle" className="w-3 h-3 text-green-200" />
                  <span className="text-green-200 text-xs font-medium">Verified Area</span>
                  <span className="text-orange-200 text-xs">•</span>
                </>
              )}
              {weather ? (
                <>
                  <span className="text-yellow-200 text-xs font-bold">{weather.temp}°C</span>
                  <span className="text-orange-200 text-xs">•</span>
                  <span className="text-orange-200 text-xs">{weather.condition}</span>
                </>
              ) : (
                <span className="text-red-200 text-xs">Weather Unavailable</span>
              )}
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <motion.div
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <CustomIcon icon="Community" className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Quick stats */}
        <motion.div
          className="mt-4 flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-sm border border-white/10"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <Star className="w-4 h-4 text-yellow-200 fill-yellow-200" />
            <span className="text-white text-sm font-medium">4.8 Trust Score</span>
          </motion.div>
          <motion.div
            className="bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2 backdrop-blur-sm border border-white/10"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <CustomIcon icon="LocationPin" className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">2.3km radius</span>
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
                  if (story.title === 'Auto Share') setActiveFilter('help_request');
                  else if (story.title === 'Food Hunt') setActiveFilter('food_recommendation');
                  else toast.info('Story feature coming soon! 🎬');
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Chennai Quick Actions */}
      <motion.div
        className="px-6 py-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { filter: 'help_request', icon: 'AutoRickshaw', label: 'Auto Share', delay: 0 },
            { filter: 'food_recommendation', icon: 'FilterCoffee', label: 'Food Hunt', delay: 0.1 },
            { filter: null, icon: 'Sparkles', label: 'Live Updates', delay: 0.2, action: () => navigate('/live') },
            { filter: null, icon: 'BeachWaves', label: 'Chennai Gethu', delay: 0.3, action: () => navigate('/chennai-gethu') },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + item.delay }}
            >
              <Button
                variant={activeFilter === item.filter ? 'default' : 'outline'}
                className={`flex-col h-auto py-3 border-orange-200 hover:bg-orange-50 w-full transition-all duration-300 ${activeFilter === item.filter ? 'bg-orange-100 text-orange-700 shadow-md ring-2 ring-orange-200' : 'bg-white/60 backdrop-blur-sm'
                  }`}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.filter) {
                    setActiveFilter(activeFilter === item.filter ? null : item.filter);
                  }
                }}
              >
                <div className="mb-1 transform transition-transform group-hover:scale-110">
                  <CustomIcon icon={item.icon as any} className={`w-6 h-6 ${activeFilter === item.filter ? 'text-orange-600' : 'text-orange-500'}`} />
                </div>
                <span className="text-xs text-[11px] font-medium">{item.label}</span>
              </Button>
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
                <AnimatePresence>
                  {filteredPosts.map((post, index) => (
                    <AnimatedPostCard key={post.id} delay={index * 0.1}>
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
                  ))}
                </AnimatePresence>
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