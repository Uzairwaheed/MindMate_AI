import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];

export interface CreateJournalEntryData {
  title?: string;
  content: string;
  moodRating?: number;
  entryDate?: string;
}

export interface JournalEntryWithSentiment extends JournalEntry {
  sentiment_analysis?: {
    score: number;
    magnitude: number;
    emotions: string[];
  };
}

class JournalService {
  // Create a new journal entry
  async createEntry(entryData: CreateJournalEntryData): Promise<JournalEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Analyze sentiment of the content
      const sentimentScore = await this.analyzeSentiment(entryData.content);

      const insertData: JournalEntryInsert = {
        user_id: user.id,
        title: entryData.title || '',
        content: entryData.content,
        mood_rating: entryData.moodRating ? Math.ceil(entryData.moodRating / 2) : null,
        sentiment_score: sentimentScore,
        entry_date: entryData.entryDate || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('journal_entries')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create journal entry error:', error);
      throw error;
    }
  }

  // Get user's journal entries
  async getUserEntries(limit?: number): Promise<JournalEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get journal entries error:', error);
      throw error;
    }
  }

  // Get entries for a specific date range
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get entries by date range error:', error);
      throw error;
    }
  }

  // Update a journal entry
  async updateEntry(entryId: string, updates: JournalEntryUpdate): Promise<JournalEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Re-analyze sentiment if content changed
      if (updates.content) {
        updates.sentiment_score = await this.analyzeSentiment(updates.content);
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update journal entry error:', error);
      throw error;
    }
  }

  // Delete a journal entry
  async deleteEntry(entryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete journal entry error:', error);
      throw error;
    }
  }

  // Get mood analytics for dashboard
  async getMoodAnalytics(): Promise<{
    weeklyAverage: number;
    trend: number;
    totalEntries: number;
    recentEntries: JournalEntry[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      // Get entries from last week
      const thisWeekEntries = await this.getEntriesByDateRange(
        oneWeekAgo.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );

      // Get entries from week before
      const lastWeekEntries = await this.getEntriesByDateRange(
        twoWeeksAgo.toISOString().split('T')[0],
        oneWeekAgo.toISOString().split('T')[0]
      );

      // Calculate averages
      const thisWeekAvg = thisWeekEntries.length > 0 
        ? thisWeekEntries.reduce((sum, entry) => sum + (entry.sentiment_score + 1) * 2.5, 0) / thisWeekEntries.length
        : 0;

      const lastWeekAvg = lastWeekEntries.length > 0
        ? lastWeekEntries.reduce((sum, entry) => sum + (entry.sentiment_score + 1) * 2.5, 0) / lastWeekEntries.length
        : 0;

      const trend = thisWeekAvg - lastWeekAvg;

      // Get total entries count
      const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        weeklyAverage: Math.round(thisWeekAvg * 10) / 10,
        trend: Math.round(trend * 10) / 10,
        totalEntries: count || 0,
        recentEntries: thisWeekEntries.slice(0, 5),
      };
    } catch (error) {
      console.error('Get mood analytics error:', error);
      throw error;
    }
  }

  // Simple sentiment analysis (placeholder for AI service)
  private async analyzeSentiment(text: string): Promise<number> {
    try {
      // This is a simple placeholder implementation
      // In production, you would integrate with a real sentiment analysis API
      const positiveWords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'love', 'joy', 'excited', 'grateful', 'peaceful'];
      const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious', 'worried', 'stressed'];
      
      const words = text.toLowerCase().split(/\s+/);
      let score = 0;
      
      words.forEach(word => {
        if (positiveWords.some(pos => word.includes(pos))) score += 0.1;
        if (negativeWords.some(neg => word.includes(neg))) score -= 0.1;
      });
      
      // Normalize to -1 to 1 range
      return Math.max(-1, Math.min(1, score));
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return 0; // Neutral sentiment on error
    }
  }
}

export const journalService = new JournalService();