import React, { useState, useEffect } from 'react';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AchievementBadges } from './AchievementBadges';
import { ChennaiIcons } from './IllustratedIcon';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useLanguage } from '../services/LanguageService';
import { AppHealthCheck } from './AppHealthCheck';
import DeploymentReadiness from './DeploymentReadiness';
import { useLocation } from '../services/LocationService';
import { useAuth } from './auth/SupabaseAuthProvider';
import { ProfileService, type Profile } from '../services/ProfileService';
import { toast } from 'sonner';
import {
  MapPin,
  ChevronRight,
  Edit2,
  Loader2,
  User
} from 'lucide-react';
import profileCommunity from 'figma:asset/39dd468cce8081c14f345796484cc8b182dc6bb6.png';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'status'>('overview');
  const { currentLocation, setLocationModalOpen, previousLocations } = useLocation();

  // Fetch profile on mount
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await ProfileService.getProfile(user.id);
      if (data) {
        setProfile(data);
        // Initialize edit form with current values
        setEditFullName(data.full_name || '');
        setEditArea(data.area || '');
        setEditAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const updated = await ProfileService.updateProfile(user.id, {
        full_name: editFullName || undefined,
        area: editArea || undefined,
        avatar_url: editAvatarUrl || undefined,
      });

      if (updated) {
        setProfile(updated);
        setEditDialogOpen(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const userStats = [
    {
      label: 'Trust Score',
      value: '4.8',
      iconSrc: ChennaiIcons.trust,
      iconEmoji: '⭐',
      color: 'text-yellow-600'
    },
    {
      label: 'Connections',
      value: '127',
      iconSrc: ChennaiIcons.community,
      iconEmoji: '👥',
      color: 'text-blue-600'
    },
    {
      label: 'Posts Shared',
      value: '23',
      iconSrc: ChennaiIcons.chat,
      iconEmoji: '💬',
      color: 'text-green-600'
    },
    {
      label: 'Events Joined',
      value: '8',
      iconSrc: ChennaiIcons.celebration,
      iconEmoji: '🎉',
      color: 'text-purple-600'
    }
  ];

  const achievements = [
    {
      title: 'நல்ல பக்கத்து வீட்டுக்காரர்',
      description: '10+ neighbors-க்கு உதவி செய்தது',
      icon: '🤝',
      earned: true,
      rarity: 'Common'
    },
    {
      title: 'சென்னை Food Expert',
      description: '5+ authentic food spots share',
      icon: '🍽️',
      earned: true,
      rarity: 'Rare'
    },
    {
      title: 'Trust-ed Chennai-ite',
      description: '4.5+ நம்பிக்கை score',
      icon: '⭐',
      earned: true,
      rarity: 'Legendary'
    },
    {
      title: 'Marina Cleanup Hero',
      description: 'Beach cleanup-ல பங்கேற்றது',
      icon: '🌊',
      earned: true,
      rarity: 'Rare'
    }
  ];

  const menuItems = [
    {
      iconSrc: ChennaiIcons.verified,
      iconEmoji: '📍',
      label: 'Manage Locations',
      subtitle: `${previousLocations.length + (currentLocation ? 1 : 0)} areas • Change or add locations`,
      action: () => setLocationModalOpen(true)
    },
    {
      iconSrc: ChennaiIcons.verified,
      iconEmoji: '⚙️',
      label: 'Settings',
      subtitle: 'Privacy, notifications, language'
    },
    {
      iconSrc: ChennaiIcons.trust,
      iconEmoji: '🛡️',
      label: 'Safety & Trust',
      subtitle: 'Community guidelines, reporting'
    },
    {
      iconSrc: ChennaiIcons.helper,
      iconEmoji: '💝',
      label: 'Your Impact',
      subtitle: 'See how you\'ve helped the community'
    },
    {
      iconSrc: ChennaiIcons.community,
      iconEmoji: '❓',
      label: 'Help & Support',
      subtitle: 'FAQ, contact us'
    },
    {
      iconSrc: ChennaiIcons.community,
      iconEmoji: '🚪',
      label: 'Sign Out',
      subtitle: 'Log out of your account',
      isDestructive: true,
      action: signOut
    }
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-yellow-25">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-orange-50 to-yellow-25 min-h-screen relative">
      {/* Profile community background */}
      <div className="fixed inset-0 opacity-12 md:opacity-8 pointer-events-none">
        <ImageWithFallback
          src={profileCommunity}
          alt="Chennai Profile Community"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with profile info */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-8 rounded-b-[2rem]">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-20 h-20">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">{getInitials(profile?.full_name)}</span>
                </div>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-white text-2xl font-bold">{profile?.full_name || 'User'}</h1>
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Area</Label>
                        <Input
                          id="area"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          placeholder="e.g., Mylapore, Chennai"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar_url">Avatar URL</Label>
                        <Input
                          id="avatar_url"
                          value={editAvatarUrl}
                          onChange={(e) => setEditAvatarUrl(e.target.value)}
                          placeholder="https://..."
                        />
                        <p className="text-xs text-gray-500">Enter a URL to your profile picture</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditDialogOpen(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEditProfile}
                        disabled={saving}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2 text-orange-100 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{profile?.area || 'Chennai'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-white/30">
                  <span className="mr-1">🛡️</span>
                  Verified Neighbor
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {userStats.map((stat, index) => (
              <div key={index} className="bg-white/20 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <span className="text-white text-lg">{stat.iconEmoji}</span>
                </div>
                <div className="text-white font-bold text-lg">{stat.value}</div>
                <div className="text-orange-100 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-4">
          <div className="flex bg-orange-100 rounded-xl p-1">
            <Button
              onClick={() => setActiveTab('overview')}
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className={`flex-1 text-xs ${activeTab === 'overview'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-orange-600 hover:bg-orange-200'
                }`}
            >
              Overview
            </Button>
            <Button
              onClick={() => setActiveTab('achievements')}
              variant={activeTab === 'achievements' ? 'default' : 'ghost'}
              className={`flex-1 text-xs ${activeTab === 'achievements'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-orange-600 hover:bg-orange-200'
                }`}
            >
              <span className="mr-1">🏆</span>
              Achievements
            </Button>
            <Button
              onClick={() => setActiveTab('status')}
              variant={activeTab === 'status' ? 'default' : 'ghost'}
              className={`flex-1 text-xs ${activeTab === 'status'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-orange-600 hover:bg-orange-200'
                }`}
            >
              <span className="mr-1">🚀</span>
              App Status
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Community bio */}
            <div className="px-6 pb-4">
              <Card className="p-4 bg-card backdrop-blur-sm border-orange-200 shadow-lg shadow-orange-100/50">
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {profile?.full_name ? (
                    `Chennai community member. Area: ${profile.area || 'Chennai'}.`
                  ) : (
                    'Update your profile to add more information about yourself!'
                  )}
                </p>
              </Card>
            </div>

            {/* Recent Achievements Preview */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3>Recent Achievements</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('achievements')}
                  className="text-orange-600 hover:bg-orange-50"
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {achievements.filter(a => a.earned).slice(0, 3).map((achievement, index) => (
                  <Card key={index} className="p-2 bg-card border-orange-200 text-center shadow-md shadow-orange-100/30">
                    <div className="text-lg mb-1">{achievement.icon}</div>
                    <h4 className="text-xs font-medium text-gray-900 mb-1">{achievement.title}</h4>
                    <Badge className={`text-xs ${achievement.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-700' :
                      achievement.rarity === 'Epic' ? 'bg-purple-100 text-purple-700' :
                        achievement.rarity === 'Rare' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {achievement.rarity}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'achievements' && (
          <div className="px-6 pb-4">
            <AchievementBadges />
          </div>
        )}

        {activeTab === 'status' && (
          <div className="px-6 pb-4 space-y-4">
            <AppHealthCheck />
            <DeploymentReadiness />
          </div>
        )}

        {/* Menu items */}
        <div className="px-6 pb-20">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <Card
                key={index}
                className="p-4 bg-card backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] shadow-orange-100/50"
                onClick={item.action}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isDestructive
                    ? 'bg-red-100'
                    : 'bg-orange-100'
                    }`}>
                    <span className={`text-lg ${item.isDestructive
                      ? 'text-red-600'
                      : 'text-orange-600'
                      }`}>
                      {item.iconEmoji}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${item.isDestructive ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.label}
                    </h4>
                    <p className="text-sm text-gray-500">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}