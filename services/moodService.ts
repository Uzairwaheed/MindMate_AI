import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type MoodEntry = Database['public']['Tables']['mood_entries']['Row'];
type MoodEntryInsert = Database['public']['Tables']['mood_entries']['Insert'];
type MoodEntryUpdate = Database['public']['Tables']['mood_entries']['Update'];
type SentimentAnalysis = Database['public']['Tables']['sentiment_analyses']['Row'];
type SentimentAnalysisInsert = Database['public']['Tables']['sentiment_analyses']['Insert'];

export interface CreateMoodEntryData {
  moodScore: number;
  energyLevel?: number;
  anxietyLevel?: number;
  stressLevel?: number;
  sleepQuality?: number;
  emotions?: string[];
  notes?: string;
  entryDate?: string;
}

export interface UpdateMoodEntryData {
  moodScore?: number;
  energyLevel?: number;
  anxietyLevel?: number;
  stressLevel?: number;
  sleepQuality?: number;
  emotions?: string[];
  notes?: string;
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

export interface ParsedMoodEntry extends MoodEntry {
  parsed: {
    moodScore: number;
    energyLevel: number;
    anxietyLevel: number;
    stressLevel: number;
    sleepQuality: number;
    userNotes: string;
  };
}

class MoodService {
  // Parse notes field to extract individual metrics
  private parseNotesField(notes: string): {
    moodScore: number;
    energyLevel: number;
    anxietyLevel: number;
    stressLevel: number;
    sleepQuality: number;
    userNotes: string;
  } {
    const defaultValues = {
      moodScore: 5,
      energyLevel: 5,
      anxietyLevel: 5,
      stressLevel: 5,
      sleepQuality: 5,
      userNotes: '',
    };

    if (!notes) return defaultValues;

    try {
      // Extract values using regex patterns
      const moodMatch = notes.match(/Mood:\s*(\d+)/);
      const energyMatch = notes.match(/Energy:\s*(\d+)/);
      const anxietyMatch = notes.match(/Anxiety:\s*(\d+)/);
      const stressMatch = notes.match(/Stress:\s*(\d+)/);
      const sleepMatch = notes.match(/Sleep:\s*(\d+)/);
      
      // Extract user notes (everything after the metrics)
      const metricsEnd = notes.lastIndexOf('/10');
      const userNotes = metricsEnd !== -1 ? notes.substring(metricsEnd + 4).trim() : notes;

      return {
        moodScore: moodMatch ? parseInt(moodMatch[1]) : defaultValues.moodScore,
        energyLevel: energyMatch ? parseInt(energyMatch[1]) : defaultValues.energyLevel,
        anxietyLevel: anxietyMatch ? parseInt(anxietyMatch[1]) : defaultValues.anxietyLevel,
        stressLevel: stressMatch ? parseInt(stressMatch[1]) : defaultValues.stressLevel,
        sleepQuality: sleepMatch ? parseInt(sleepMatch[1]) : defaultValues.sleepQuality,
        userNotes: userNotes.startsWith('.') ? userNotes.substring(1).trim() : userNotes,
      };
    } catch (error) {
      console.error('Error parsing notes field:', error);
      return defaultValues;
    }
  }

  // Format notes field with all metrics
  private formatNotesField(data: CreateMoodEntryData | UpdateMoodEntryData): string {
    const mood = data.moodScore || 5;
    const energy = data.energyLevel || 5;
    const anxiety = data.anxietyLevel || 5;
    const stress = data.stressLevel || 5;
    const sleep = data.sleepQuality || 5;
    const userNotes = data.notes?.trim() || '';

    let formattedNotes = `Mood: ${mood}/10, Energy: ${energy}/10, Anxiety: ${anxiety}/10, Stress: ${stress}/10, Sleep: ${sleep}/10`;
    
    if (userNotes) {
      formattedNotes += `. ${userNotes}`;
    }

    return formattedNotes;
  }

  // Create a mood entry
  async createMoodEntry(entryData: CreateMoodEntryData): Promise<ParsedMoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Convert 1-10 scale to 1-5 scale for database constraint
      const dbMoodScore = Math.max(1, Math.min(5, Math.ceil((entryData.moodScore || 5) / 2)));

      const insertData: MoodEntryInsert = {
        user_id: user.id,
        mood_score: dbMoodScore,
        emotions: entryData.emotions || [],
        notes: this.formatNotesField(entryData),
        entry_date: entryData.entryDate || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('mood_entries')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Return parsed entry
      return {
        ...data,
        parsed: this.parseNotesField(data.notes),
      };
    } catch (error) {
      console.error('Create mood entry error:', error);
      throw error;
    }
  }

  // Update a mood entry
  async updateMoodEntry(entryId: string, updates: UpdateMoodEntryData): Promise<ParsedMoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const updateData: MoodEntryUpdate = {};

      // Update mood score if provided
      if (updates.moodScore !== undefined) {
        updateData.mood_score = Math.max(1, Math.min(5, Math.ceil(updates.moodScore / 2)));
      }

      // Update emotions if provided
      if (updates.emotions !== undefined) {
        updateData.emotions = updates.emotions;
      }

      // Update notes with all metrics if any metric is provided
      if (Object.keys(updates).some(key => ['moodScore', 'energyLevel', 'anxietyLevel', 'stressLevel', 'sleepQuality', 'notes'].includes(key))) {
        // Get current entry to merge with updates
        const { data: currentEntry } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('id', entryId)
          .eq('user_id', user.id)
          .single();

        if (currentEntry) {
          const currentParsed = this.parseNotesField(currentEntry.notes);
          const mergedData = {
            moodScore: updates.moodScore ?? currentParsed.moodScore,
            energyLevel: updates.energyLevel ?? currentParsed.energyLevel,
            anxietyLevel: updates.anxietyLevel ?? currentParsed.anxietyLevel,
            stressLevel: updates.stressLevel ?? currentParsed.stressLevel,
            sleepQuality: updates.sleepQuality ?? currentParsed.sleepQuality,
            notes: updates.notes ?? currentParsed.userNotes,
          };
          updateData.notes = this.formatNotesField(mergedData);
        }
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .update(updateData)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        parsed: this.parseNotesField(data.notes),
      };
    } catch (error) {
      console.error('Update mood entry error:', error);
      throw error;
    }
  }

  // Delete a mood entry
  async deleteMoodEntry(entryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete mood entry error:', error);
      throw error;
    }
  }

  // Get user's mood entries with parsed data
  async getUserMoodEntries(limit?: number): Promise<ParsedMoodEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(entry => ({
        ...entry,
        parsed: this.parseNotesField(entry.notes),
      }));
    } catch (error) {
      console.error('Get mood entries error:', error);
      throw error;
    }
  }

  // Get mood entries for date range
  async getMoodEntriesByDateRange(startDate: string, endDate: string): Promise<ParsedMoodEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(entry => ({
        ...entry,
        parsed: this.parseNotesField(entry.notes),
      }));
    } catch (error) {
      console.error('Get mood entries by date range error:', error);
      throw error;
    }
  }

  // Get mood statistics with accurate calculations
  async getMoodStatistics(): Promise<{
    averageMood: number;
    totalEntries: number;
    streakDays: number;
    mostCommonEmotion: string;
    weeklyTrend: 'improving' | 'declining' | 'stable';
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get last 14 days of entries for trend analysis
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const today = new Date().toISOString().split('T')[0];

      const entries = await this.getMoodEntriesByDateRange(
        fourteenDaysAgo.toISOString().split('T')[0],
        today
      );

      if (entries.length === 0) {
        return {
          averageMood: 0,
          totalEntries: 0,
          streakDays: 0,
          mostCommonEmotion: 'neutral',
          weeklyTrend: 'stable',
        };
      }

      // Calculate average mood from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentEntries = entries.filter(entry => 
        new Date(entry.entry_date) >= sevenDaysAgo
      );

      const averageMood = recentEntries.length > 0
        ? recentEntries.reduce((sum, entry) => sum + entry.parsed.moodScore, 0) / recentEntries.length
        : 0;

      // Calculate trend (compare first half vs second half of last 14 days)
      const firstHalf = entries.slice(0, Math.floor(entries.length / 2));
      const secondHalf = entries.slice(Math.floor(entries.length / 2));

      let weeklyTrend: 'improving' | 'declining' | 'stable' = 'stable';
      
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.parsed.moodScore, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.parsed.moodScore, 0) / secondHalf.length;
        const difference = secondHalfAvg - firstHalfAvg;

        if (difference > 0.5) weeklyTrend = 'improving';
        else if (difference < -0.5) weeklyTrend = 'declining';
      }

      // Calculate streak (consecutive days with entries)
      let streakDays = 0;
      let currentDate = new Date();
      const entryDates = new Set(entries.map(entry => entry.entry_date));

      while (entryDates.has(currentDate.toISOString().split('T')[0])) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Find most common emotion
      const emotionCounts: { [key: string]: number } = {};
      entries.forEach(entry => {
        entry.emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      });

      const mostCommonEmotion = Object.keys(emotionCounts).length > 0
        ? Object.keys(emotionCounts).reduce((a, b) => 
            emotionCounts[a] > emotionCounts[b] ? a : b
          )
        : 'neutral';

      return {
        averageMood: Math.round(averageMood * 10) / 10,
        totalEntries: entries.length,
        streakDays,
        mostCommonEmotion,
        weeklyTrend,
      };
    } catch (error) {
      console.error('Get mood statistics error:', error);
      throw error;
    }
  }

  // Get mood calendar data
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
      
      const emotions = ['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited'];
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
}

export const moodService = new MoodService();