import { useState, useEffect } from 'react';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { ChennaiPride } from './ChennaiPride';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../services/LanguageService';
import { Heart, MessageCircle, Share2, MapPin, Star, Shield, Navigation, Loader2, Sparkles, Zap } from 'lucide-react';
import { IllustratedIcon, ChennaiIcons } from './IllustratedIcon';
import { useLocation, getLocationSpecificContent } from '../services/LocationService';
import { useExternalData } from '../services/ExternalDataService';
import { PostService, Post } from '../services/PostService';
import { AiService } from '../services/AiService';
import { useAuth } from './auth/SupabaseAuthProvider';
import { supabase } from '../services/supabaseClient';
import communityScenes from 'figma:asset/39dd468cce8081c14f345796484cc8b182dc6bb6.png';
import { toast } from 'sonner';

interface CommunityFeedProps {
  userLocation?: any;
  onShowLiveUpdates?: () => void;
}

export function CommunityFeed({ userLocation, onShowLiveUpdates }: CommunityFeedProps) {
  const [showChennaiPride, setShowChennaiPride] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { currentLocation, setLocationModalOpen } = useLocation();
  const { weather } = useExternalData();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<string>('general');
  const [isPosting, setIsPosting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // AI Summarization State
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});

  // Use location from context if available, otherwise use prop
  const activeLocation = currentLocation || userLocation;

  // Get location-specific content
  const locationContent = getLocationSpecificContent(activeLocation);

  // Fetch posts with pagination
  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    fetchPosts(0);

    // Set up real-time subscription for new posts
    const subscription = setupRealtimeSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [activeLocation]);

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel(`posts-${activeLocation?.area || 'all'}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'posts',
            filter: activeLocation?.area ? `area=eq.${activeLocation.area}` : undefined
          },
          (payload: any) => {
            if (payload.new) {
              const newPost: Post = {
                id: payload.new.id,
                created_at: payload.new.created_at,
                content: payload.new.content,
                image_url: payload.new.image_url,
                user_id: payload.new.user_id,
                area: payload.new.area,
                category: payload.new.category,
                likes: payload.new.likes || 0,
                comments_count: payload.new.comments_count || 0,
                is_liked_by_user: false,
                profiles: undefined
              };
              setPosts(prev => [newPost, ...prev]);
            }
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      console.error('Failed to setup realtime subscription:', err);
      return null;
    }
  };

  const fetchPosts = async (page: number = 0) => {
    try {
      if (page === 0) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const pageSize = 10;
      const area = activeLocation?.area;
      const data = await PostService.getPosts(page, pageSize, area);

      if (page === 0) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }

      // Check if we have more posts
      setHasMore(data.length === pageSize);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch posts', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchPosts(currentPage + 1);
    }
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
      const category = newPostCategory;

      const newPost = await PostService.createPost(newPostContent, category, area, user.id);

      if (newPost) {
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setNewPostCategory('general');
        setIsPostDialogOpen(false);
        toast.success('Post created successfully!');
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
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ));

      await PostService.likePost(postId);
    } catch (error) {
      console.error('Failed to like post', error);
      // Revert on error
      fetchPosts();
    }
  };

  const handleSummarize = async (postId: string, content: string) => {
    if (summaries[postId]) return; // Already summarized

    setSummarizing(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await AiService.summarizePost(content);
      if (response.content) {
        setSummaries(prev => ({ ...prev, [postId]: response.content }));
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

  // Filter posts based on active filter
  const filteredPosts = activeFilter
    ? posts.filter(post => post.category === activeFilter)
    : posts;

  const getCategoryConfig = (type: string | undefined) => {
    if (!type) return null;

    const categoryMap: Record<string, { color: string, textColor: string, borderColor: string, icon: any, tamil: string, english: string }> = {
      'food_recommendation': {
        color: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        icon: ChennaiIcons.food,
        tamil: 'சாப்பாடு',
        english: 'Food'
      },
      'food': {
        color: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        icon: ChennaiIcons.food,
        tamil: 'சாப்பாடு',
        english: 'Food'
      },
      'community_event': {
        color: 'bg-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        icon: ChennaiIcons.community,
        tamil: 'நிகழ்ச்சி',
        english: 'Event'
      },
      'event': {
        color: 'bg-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        icon: ChennaiIcons.community,
        tamil: 'நிகழ்ச்சி',
        english: 'Event'
      },
      'cultural_event': {
        color: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        icon: ChennaiIcons.temple,
        tamil: 'பண்டிகை',
        english: 'Festival'
      },
      'help_request': {
        color: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: ChennaiIcons.auto,
        tamil: 'உதவி',
        english: 'Help'
      },
      'help': {
        color: 'bg-blue-100',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: ChennaiIcons.auto,
        tamil: 'உதவி',
        english: 'Help'
      },
      'alert': {
        color: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        icon: ChennaiIcons.auto,
        tamil: 'எச்சரிக்கை',
        english: 'Alert'
      },
      'general': {
        color: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        icon: ChennaiIcons.family,
        tamil: 'பொதுவானது',
        english: 'General'
      }
    };

    return categoryMap[type.toLowerCase()] || null;
  };

  const getPostBadge = (type: string | undefined) => {
    const config = getCategoryConfig(type);
    if (!config) return null;

    return (
      <Badge className={`${config.color} ${config.textColor} ${config.borderColor} flex items-center gap-1 text-xs`}>
        <IllustratedIcon src={config.icon} alt={config.english} size="sm" className="w-3 h-3" />
        {config.tamil}
      </Badge>
    );
  };

  return (
    <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen relative">
      {/* Community scenes background */}
      <div className="fixed inset-0 opacity-15 md:opacity-10 pointer-events-none">
        <ImageWithFallback
          src={communityScenes}
          alt="Chennai Community Scenes"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-6 rounded-b-[2rem] relative overflow-hidden">
        {/* Traditional pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='50' cy='10' r='2'/%3E%3Ccircle cx='10' cy='50' r='2'/%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }} />
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1">
            <h1 className="text-white text-2xl font-bold">{t('feed.title', locationContent.greeting)}</h1>
            <div className="flex items-center gap-2">
              <p className="text-orange-100">
                {activeLocation ? `${activeLocation.area} • ${activeLocation.pincode}` : 'Mylapore • மயிலாப்பூர்'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-orange-200 hover:text-white hover:bg-white/10"
                onClick={() => setLocationModalOpen(true)}
              >
                <Navigation className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {activeLocation && (
                <>
                  <Shield className="w-3 h-3 text-green-200" />
                  <span className="text-green-200 text-xs">Verified Area</span>
                  <span className="text-orange-200 text-xs">•</span>
                </>
              )}
              {weather ? (
                <>
                  <span className="text-yellow-200 text-xs">{weather.temp}°C</span>
                  <span className="text-orange-200 text-xs">•</span>
                  <span className="text-orange-200 text-xs">{weather.condition}</span>
                </>
              ) : (
                <>
                  <span className="text-red-200 text-xs">Weather Unavailable</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <IllustratedIcon
                src={ChennaiIcons.family}
                alt="Profile"
                size="md"
                className="border-2 border-white/30"
              />
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex gap-4">
          <div className="bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-200" />
            <span className="text-white text-sm">4.8 Trust Score</span>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-white text-sm">2.3km radius</span>
          </div>
        </div>
      </div>

      {/* Chennai Quick Actions */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Button
            variant={activeFilter === 'help_request' ? 'default' : 'outline'}
            className={`flex-col h-auto py-3 border-orange-200 hover:bg-orange-50 ${activeFilter === 'help_request' ? 'bg-orange-100 text-orange-700' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'help_request' ? null : 'help_request')}
          >
            <IllustratedIcon src={ChennaiIcons.auto} alt="Auto" size="sm" className="mb-1" />
            <span className="text-xs text-[11px]">Auto Share</span>
          </Button>
          <Button
            variant={activeFilter === 'food_recommendation' ? 'default' : 'outline'}
            className={`flex-col h-auto py-3 border-orange-200 hover:bg-orange-50 ${activeFilter === 'food_recommendation' ? 'bg-orange-100 text-orange-700' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'food_recommendation' ? null : 'food_recommendation')}
          >
            <IllustratedIcon src={ChennaiIcons.food} alt="Food" size="sm" className="mb-1" />
            <span className="text-xs text-[11px]">Food Hunt</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-3 border-orange-200 hover:bg-orange-50"
            onClick={onShowLiveUpdates}
          >
            <Zap className="w-5 h-5 mb-1" />
            <span className="text-xs">Live Updates</span>
          </Button>
          <Button
            variant={showChennaiPride ? 'default' : 'outline'}
            className={`flex-col h-auto py-3 border-orange-200 hover:bg-orange-50 ${showChennaiPride ? 'bg-orange-100 text-orange-700' : ''}`}
            onClick={() => setShowChennaiPride(!showChennaiPride)}
          >
            <IllustratedIcon src={ChennaiIcons.beach} alt="Chennai Pride" size="sm" className="mb-1" />
            <span className="text-xs text-[11px]">Chennai Pride</span>
          </Button>
        </div>

        {/* Chennai Pride Section */}
        {showChennaiPride && (
          <div className="mb-4">
            <ChennaiPride />
          </div>
        )}

        {/* Create Post Dialog */}
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogTrigger asChild>
            <Card className="p-4 bg-[#FFFFF0] backdrop-blur-md border-2 border-[#E1AD01]/60 shadow-lg shadow-orange-200/80 rounded-xl cursor-pointer hover:shadow-xl transition-all">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">You</span>
                  </div>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="w-full justify-start text-[#4B1E1E] bg-orange-50 hover:bg-orange-100 whitespace-normal break-words text-left min-h-[48px] text-sm px-3 py-2 h-auto rounded-md border border-orange-200 flex items-center text-gray-500">
                    {t('feed.whatsHappening', "What's happening in your area?")}
                  </div>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[#FFFFF0] border-orange-200">
            <DialogHeader>
              <DialogTitle className="text-[#4B1E1E]">Create New Post</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="Share what's happening in your neighborhood..."
                className="min-h-[100px] border-orange-200 focus-visible:ring-orange-400 bg-white"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPostDialogOpen(false)} className="border-orange-200 text-orange-700 hover:bg-orange-50">Cancel</Button>
                <Button
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  onClick={handleCreatePost}
                  disabled={isPosting || !newPostContent.trim()}
                >
                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Community posts */}
      <div className="px-6 space-y-4 pb-20">
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-sm">
            <p className="font-semibold mb-2">Error loading posts</p>
            <p className="mb-3">{error}</p>
            <Button
              size="sm"
              onClick={() => fetchPosts(0)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Try Again
            </Button>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No posts yet. Be the first to share!
          </div>
        ) : (
          <>
            {filteredPosts.map((post) => (
            <Card key={post.id} className="p-4 bg-[#FFFFF0] backdrop-blur-md border-2 border-[#E1AD01]/60 shadow-lg shadow-orange-200/80 rounded-xl">
              {/* Post header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      {post.profiles?.avatar_url ? (
                        <ImageWithFallback
                          src={post.profiles.avatar_url}
                          alt={post.profiles.full_name || 'User avatar'}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">
                            {post.profiles?.full_name ? post.profiles.full_name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-[#4B1E1E] truncate">
                        {post.profiles?.full_name || 'Anonymous'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
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
              <p className="text-[#4B1E1E] mb-3 leading-relaxed break-words">{post.content}</p>

              {/* Post image */}
              {post.image_url && (
                <div className="mb-3 rounded-xl overflow-hidden">
                  <ImageWithFallback
                    src={post.image_url}
                    alt="Post content"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* AI Summary Section */}
              {summaries[post.id] && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                  <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 italic">{summaries[post.id]}</p>
                </div>
              )}

              {/* Post actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className={`w-4 h-4 ${post.is_liked_by_user ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments_count}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 text-gray-500 hover:text-purple-500 transition-colors"
                    onClick={() => handleSummarize(post.id, post.content)}
                    disabled={summarizing[post.id]}
                  >
                    {summarizing[post.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className={`w-4 h-4 ${summaries[post.id] ? 'fill-purple-500 text-purple-500' : ''}`} />
                    )}
                    <span className="text-sm hidden sm:inline">AI Summary</span>
                  </button>
                </div>
                <button className="text-gray-500 hover:text-orange-500 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
            {hasMore && (
              <div className="flex justify-center pt-6 pb-10">
                <Button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
