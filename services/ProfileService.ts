import { supabase } from './supabaseClient';

export interface Profile {
    id: string;
    updated_at?: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    area?: string;
    language?: string;
}

export interface UpdateProfileData {
    full_name?: string;
    avatar_url?: string;
    area?: string;
    username?: string;
    language?: string;
}

export class ProfileService {
    /**
     * Get a user's profile by ID
     */
    static async getProfile(userId: string): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    /**
     * Update a user's profile
     */
    static async updateProfile(
        userId: string,
        updates: UpdateProfileData
    ): Promise<Profile | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Upload avatar image (placeholder - would need actual file upload implementation)
     */
    static async uploadAvatar(userId: string, file: File): Promise<string | null> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return null;
        }
    }

    /**
     * Check if username is available
     */
    static async isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
        try {
            let query = supabase
                .from('profiles')
                .select('id')
                .eq('username', username);

            if (currentUserId) {
                query = query.neq('id', currentUserId);
            }

            const { data, error } = await query;

            if (error) throw error;

            return !data || data.length === 0;
        } catch (error) {
            console.error('Error checking username:', error);
            return false;
        }
    }
}
