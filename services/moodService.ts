import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type MoodEntry = Database['public']['Tables']['mood_entries']['Row'];
type MoodEntryInsert = Database['public']['Tables']['mood_entries']['Insert'];
type SentimentAnalysis = Database['public']['Tables']['sentiment_analyses']['Row'];
type SentimentAnalysisInsert = Database['public']['Tables']['sentiment_analyses']['Insert'];

export interface CreateMoodEntryData {
  moodScore: number;
  emotions?: string[];
  notes?: string;
  entryDate?: string;
}

export interface SentimentAnalysisData {
  imageUrl?: string;
  detectedEmotion: string;
  confidenceScore?: number;
  analysisResult?: any;
}

export interface MoodCalendarData {
  date: string;
  moodScore: number;
  hasJournal: boolean;
  emotions: string[];
}

class MoodService {
  // Create a mood entry
  async createMoodEntry(entryData: CreateMoodEntryData): Promise<MoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const insertData: MoodEntryInsert = {
        user_id: user.id,
        mood_score: entryData.moodScore,
        emotions: entryData.emotions || [],
        notes: entryData.notes || '',
        entry_date: entryData.entryDate || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('mood_entries')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create mood entry error:', error);
      throw error;
    }
  }

  // Get mood entries for calendar view
  async getMoodCalendarData(year: number, month: number): Promise<MoodCalendarData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Get mood entries for the month
      const { data: moodEntries, error: moodError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true });

      if (moodError) throw moodError;

      // Get journal entries for the month to check which days have journals
      const { data: journalEntries, error: journalError } = await supabase
        .from('journal_entries')
        .select('entry_date')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (journalError) throw journalError;

      const journalDates = new Set(journalEntries?.map(entry => entry.entry_date) || []);

      return (moodEntries || []).map(entry => ({
        date: entry.entry_date,
        moodScore: entry.mood_score,
        hasJournal: journalDates.has(entry.entry_date),
        emotions: entry.emotions,
      }));
    } catch (error) {
      console.error('Get mood calendar data error:', error);
      throw error;
    }
  }

  // Get mood trends for the last N days
  async getMoodTrends(days: number = 14): Promise<{ date: string; score: number }[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('entry_date, mood_score')
        .eq('user_id', user.id)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(entry => ({
        date: entry.entry_date,
        score: entry.mood_score,
      }));
    } catch (error) {
      console.error('Get mood trends error:', error);
      throw error;
    }
  }

  // Create sentiment analysis record
  async createSentimentAnalysis(analysisData: SentimentAnalysisData): Promise<SentimentAnalysis> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const insertData: SentimentAnalysisInsert = {
        user_id: user.id,
        image_url: analysisData.imageUrl || null,
        detected_emotion: analysisData.detectedEmotion,
        confidence_score: analysisData.confidenceScore || 0,
        analysis_result: analysisData.analysisResult || {},
      };

      const { data, error } = await supabase
        .from('sentiment_analyses')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create sentiment analysis error:', error);
      throw error;
    }
  }

  // Get recent sentiment analyses
  async getRecentSentimentAnalyses(limit: number = 10): Promise<SentimentAnalysis[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('sentiment_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get sentiment analyses error:', error);
      throw error;
    }
  }

  // Analyze image sentiment (placeholder for AI service)
  async analyzeImageSentiment(imageBase64: string): Promise<{
    emotion: string;
    confidence: number;
    details: any;
  }> {
    try {
      // This is a placeholder implementation
      // In production, you would integrate with a real computer vision API
      // like Google Cloud Vision, AWS Rekognition, or Azure Face API
      
      const emotions = ['happy', 'sad', 'neutral', 'angry', 'surprised', 'fearful'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const confidence = Math.random() * 0.4 + 0.6; // 60-100% confidence
      
      return {
        emotion: randomEmotion,
        confidence: Math.round(confidence * 100) / 100,
        details: {
          faceDetected: true,
          imageQuality: 'good',
          processingTime: Math.random() * 2 + 1,
        },
      };
    } catch (error) {
      console.error('Image sentiment analysis error:', error);
      throw error;
    }
  }

  // Get mood statistics for dashboard
  async getMoodStatistics(): Promise<{
    averageMood: number;
    totalEntries: number;
    streakDays: number;
    mostCommonEmotion: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get all mood entries
      const { data: moodEntries, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      if (!moodEntries || moodEntries.length === 0) {
        return {
          averageMood: 0,
          totalEntries: 0,
          streakDays: 0,
          mostCommonEmotion: 'neutral',
        };
      }

      // Calculate average mood
      const averageMood = moodEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / moodEntries.length;

      // Calculate streak (consecutive days with entries)
      let streakDays = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date(today);

      for (const entry of moodEntries) {
        const entryDate = entry.entry_date;
        const expectedDate = currentDate.toISOString().split('T')[0];
        
        if (entryDate === expectedDate) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Find most common emotion
      const emotionCounts: { [key: string]: number } = {};
      moodEntries.forEach(entry => {
        entry.emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      });

      const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
      );

      return {
        averageMood: Math.round(averageMood * 10) / 10,
        totalEntries: moodEntries.length,
        streakDays,
        mostCommonEmotion,
      };
    } catch (error) {
      console.error('Get mood statistics error:', error);
      throw error;
    }
  }
}

export const moodService = new MoodService();