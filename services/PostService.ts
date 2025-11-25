import { supabase } from './supabaseClient';

export interface Post {
    id: string;
    created_at: string;
    content: string;
    image_url?: string;
    user_id: string;
    area?: string;
    category?: string;
    likes: number;
    comments_count: number;
    profiles?: {
        full_name: string;
        avatar_url: string;
    };
    is_liked_by_user?: boolean; // Virtual field
}

export const PostService = {
    /**
     * Fetch posts, optionally filtered by area
     */
    async getPosts(area?: string): Promise<Post[]> {
        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles (
                    full_name,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false });

        if (area) {
            // Simple filter for now, can be improved with PostGIS later
            query = query.ilike('area', `%${area}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Create a new post
     */
    async createPost(content: string, category: string, area: string, userId: string): Promise<Post | null> {
        const { data, error } = await supabase
            .from('posts')
            .insert({
                content,
                category,
                area,
                user_id: userId
            })
            .select(`
                *,
                profiles (
                    full_name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error('Error creating post:', error);
            throw error;
        }

        return data;
    },

    /**
     * Like a post (Simple increment for now, ideally should be a separate table)
     */
    async likePost(postId: string): Promise<void> {
        // RPC call would be better for atomicity, but simple update for MVP
        // First get current likes
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('likes')
            .eq('id', postId)
            .single();

        if (fetchError) throw fetchError;

        const newLikes = (post?.likes || 0) + 1;

        const { error: updateError } = await supabase
            .from('posts')
            .update({ likes: newLikes })
            .eq('id', postId);

        if (updateError) throw updateError;
    }
};
