import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
    id: string;
    created_at: string;
    content: string;
    sender_id: string;
    chat_id: string;
    is_read: boolean;

    // Joined profile data
    profiles?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export interface SendMessageData {
    content: string;
    chat_id: string;
}

export class ChatService {
    private static subscriptions: Map<string, RealtimeChannel> = new Map();

    /**
     * Get messages for a specific chat
     */
    static async getMessages(chatId: string): Promise<Message[]> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          *,
          profiles:sender_id (
            id,
            full_name,
            avatar_url
          )
        `)
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    /**
     * Send a new message
     */
    static async sendMessage(
        content: string,
        chatId: string,
        senderId: string
    ): Promise<Message | null> {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    content,
                    chat_id: chatId,
                    sender_id: senderId,
                    is_read: false,
                })
                .select(`
          *,
          profiles:sender_id (
            id,
            full_name,
            avatar_url
          )
        `)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Mark messages as read
     */
    static async markAsRead(messageIds: string[]): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .in('id', messageIds);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            return false;
        }
    }

    /**
     * Subscribe to real-time messages for a specific chat
     */
    static subscribeToChat(
        chatId: string,
        onNewMessage: (message: Message) => void
    ): () => void {
        const channelName = `chat_${chatId}`;

        // Unsubscribe from existing channel if it exists
        this.unsubscribe(channelName);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                async (payload) => {
                    console.log('New message:', payload);

                    // Fetch the full message with profile data
                    const { data } = await supabase
                        .from('messages')
                        .select(`
              *,
              profiles:sender_id (
                id,
                full_name,
                avatar_url
              )
            `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        onNewMessage(data);
                    }
                }
            )
            .subscribe();

        this.subscriptions.set(channelName, channel);

        // Return unsubscribe function
        return () => this.unsubscribe(channelName);
    }

    /**
     * Unsubscribe from a specific channel
     */
    static unsubscribe(channelName: string): void {
        const channel = this.subscriptions.get(channelName);
        if (channel) {
            supabase.removeChannel(channel);
            this.subscriptions.delete(channelName);
        }
    }

    /**
     * Unsubscribe from all channels
     */
    static unsubscribeAll(): void {
        this.subscriptions.forEach((channel) => {
            supabase.removeChannel(channel);
        });
        this.subscriptions.clear();
    }

    /**
     * Get unread message count for a chat
     */
    static async getUnreadCount(chatId: string, userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chatId)
                .eq('is_read', false)
                .neq('sender_id', userId);

            if (error) throw error;

            return count || 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Delete a message (only by sender)
     */
    static async deleteMessage(messageId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            return false;
        }
    }
}
