import { supabase } from '@/lib/supabase';

interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  emotions: string[];
  notes: string;
  entry_date: string;
  entry_time: string;
  created_at: string;
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

interface CreateMoodEntryData {
  moodScore: number;
  energyLevel: number;
  anxietyLevel: number;
  stressLevel: number;
  sleepQuality: number;
  emotions?: string[];
  notes?: string;
  entryDate?: string;
  entryTime?: string;
}

export interface UpdateMoodEntryData {
  moodScore?: number;
  energyLevel?: number;
  anxietyLevel?: number;
  stressLevel?: number;
  sleepQuality?: number;
  emotions?: string[];
  notes?: string;
  entryDate?: string;
  entryTime?: string;
}

class MoodService {
  private _formatMoodEntryNotes(data: CreateMoodEntryData | UpdateMoodEntryData): string {
    const parts = [];
    
    if (data.moodScore !== undefined) parts.push(`Mood: ${data.moodScore}`);
    if (data.energyLevel !== undefined) parts.push(`Energy: ${data.energyLevel}`);
    if (data.anxietyLevel !== undefined) parts.push(`Anxiety: ${data.anxietyLevel}`);
    if (data.stressLevel !== undefined) parts.push(`Stress: ${data.stressLevel}`);
    if (data.sleepQuality !== undefined) parts.push(`Sleep: ${data.sleepQuality}`);
    
    if (data.notes && data.notes.trim()) {
      parts.push(`Notes: ${data.notes.trim()}`);
    }
    
    return parts.join(' | ');
  }

  private _parseMoodEntryNotes(entry: MoodEntry): ParsedMoodEntry {
    const parsed = {
      moodScore: entry.mood_score * 2, // Convert 1-5 to 1-10 scale
      energyLevel: 5,
      anxietyLevel: 5,
      stressLevel: 5,
      sleepQuality: 5,
      userNotes: '',
    };

    if (entry.notes) {
      const moodMatch = entry.notes.match(/Mood:\s*(\d+)/);
      const energyMatch = entry.notes.match(/Energy:\s*(\d+)/);
      const anxietyMatch = entry.notes.match(/Anxiety:\s*(\d+)/);
      const stressMatch = entry.notes.match(/Stress:\s*(\d+)/);
      const sleepMatch = entry.notes.match(/Sleep:\s*(\d+)/);
      const notesMatch = entry.notes.match(/Notes:\s*(.+?)(?:\s*\||$)/);

      if (moodMatch) parsed.moodScore = parseInt(moodMatch[1]);
      if (energyMatch) parsed.energyLevel = parseInt(energyMatch[1]);
      if (anxietyMatch) parsed.anxietyLevel = parseInt(anxietyMatch[1]);
      if (stressMatch) parsed.stressLevel = parseInt(stressMatch[1]);
      if (sleepMatch) parsed.sleepQuality = parseInt(sleepMatch[1]);
      if (notesMatch) parsed.userNotes = notesMatch[1].trim();
    }

    return {
      ...entry,
      parsed,
    };
  }

  async createMoodEntry(entryData: CreateMoodEntryData): Promise<ParsedMoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Convert 1-10 scale to 1-5 scale for database constraint
      const moodScore = Math.ceil(entryData.moodScore / 2);

      const formattedNotes = this._formatMoodEntryNotes(entryData);

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_score: moodScore,
          emotions: entryData.emotions || [],
          notes: formattedNotes,
          entry_date: entryData.entryDate || new Date().toISOString().split('T')[0],
          entry_time: entryData.entryTime || new Date().toTimeString().split(' ')[0],
        })
        .select()
        .single();

      if (error) {
        console.error('Create mood entry error:', error);
        throw error;
      }

      return this._parseMoodEntryNotes(data);
    } catch (error) {
      console.error('Create mood entry error:', error);
      throw error;
    }
  }

  async getUserMoodEntries(limit?: number): Promise<ParsedMoodEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      let query = supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fetch mood entries error:', error);
        throw error;
      }

      return (data || []).map(entry => this._parseMoodEntryNotes(entry));
    } catch (error) {
      console.error('Fetch mood entries error:', error);
      throw error;
    }
  }

  async updateMoodEntry(entryId: string, updateData: UpdateMoodEntryData): Promise<ParsedMoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const updatePayload: any = {};

      if (updateData.moodScore !== undefined) {
        updatePayload.mood_score = Math.ceil(updateData.moodScore / 2);
      }

      if (updateData.emotions !== undefined) {
        updatePayload.emotions = updateData.emotions;
      }

      if (updateData.entryDate !== undefined) {
        updatePayload.entry_date = updateData.entryDate;
      }

      if (updateData.entryTime !== undefined) {
        updatePayload.entry_time = updateData.entryTime;
      }

      // Always update notes with formatted data
      const formattedNotes = this._formatMoodEntryNotes(updateData);
      updatePayload.notes = formattedNotes;

      const { data, error } = await supabase
        .from('mood_entries')
        .update(updatePayload)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update mood entry error:', error);
        throw error;
      }

      return this._parseMoodEntryNotes(data);
    } catch (error) {
      console.error('Update mood entry error:', error);
      throw error;
    }
  }

  async deleteMoodEntry(entryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete mood entry error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Delete mood entry error:', error);
      throw error;
    }
  }

  // Enhanced method for sentiment analysis with image data
  /* Sentiment Analysis - Commented Out for Future Implementation
  async analyzeImageSentiment(imageBase64: string): Promise<{
    emotion: string;
    confidence: number;
    details: any;
  }> {
    try {
      // Simulate AI image analysis
      // In production, this would call a real computer vision API
      const emotions = ['Happy', 'Sad', 'Anxious', 'Neutral', 'Excited', 'Tired'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const confidence = 0.7 + Math.random() * 0.25; // 70-95% confidence
      
      return {
        emotion: randomEmotion,
        confidence: Math.round(confidence * 100) / 100,
        details: {
          facialFeatures: {
            eyeOpenness: Math.random(),
            mouthCurvature: Math.random() * 2 - 1, // -1 to 1
            browPosition: Math.random() * 2 - 1,
          },
          emotionScores: {
            happiness: Math.random(),
            sadness: Math.random(),
            anxiety: Math.random(),
            neutral: Math.random(),
          },
        },
      };
    } catch (error) {
      console.error('Image sentiment analysis error:', error);
      throw error;
    }
  }

  // Create sentiment analysis record
  async createSentimentAnalysis(data: {
    detectedEmotion: string;
    confidenceScore: number;
    analysisResult: any;
    imageUrl?: string;
  }): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: result, error } = await supabase
        .from('sentiment_analyses')
        .insert({
          user_id: user.id,
          detected_emotion: data.detectedEmotion,
          confidence_score: data.confidenceScore,
          analysis_result: data.analysisResult,
          image_url: data.imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Create sentiment analysis error:', error);
      throw error;
    }
  }
  */

  async getMoodAnalytics(days: number = 7): Promise<{
    averageMood: number;
    weeklyTrend: 'improving' | 'declining' | 'stable';
    totalEntries: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Get current period entries
      const { data: currentEntries, error: currentError } = await supabase
        .from('mood_entries')
        .select('mood_score, notes, entry_date')
        .eq('user_id', user.id)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .lte('entry_date', endDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: true });

      if (currentError) {
        console.error('Fetch current mood analytics error:', currentError);
        throw currentError;
      }

      const entries = currentEntries || [];
      
      if (entries.length === 0) {
        return {
          averageMood: 0,
          weeklyTrend: 'stable',
          totalEntries: 0,
        };
      }

      // Calculate average mood using parsed values
      const parsedEntries = entries.map(entry => this._parseMoodEntryNotes(entry));
      const averageMood = parsedEntries.reduce((sum, entry) => sum + entry.parsed.moodScore, 0) / parsedEntries.length;

      // Get previous period for trend comparison
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      const previousEndDate = new Date(startDate);

      const { data: previousEntries } = await supabase
        .from('mood_entries')
        .select('mood_score, notes')
        .eq('user_id', user.id)
        .gte('entry_date', previousStartDate.toISOString().split('T')[0])
        .lt('entry_date', previousEndDate.toISOString().split('T')[0]);

      let weeklyTrend: 'improving' | 'declining' | 'stable' = 'stable';

      if (previousEntries && previousEntries.length > 0) {
        const parsedPreviousEntries = previousEntries.map(entry => this._parseMoodEntryNotes(entry));
        const previousAverage = parsedPreviousEntries.reduce((sum, entry) => sum + entry.parsed.moodScore, 0) / parsedPreviousEntries.length;
        
        const difference = averageMood - previousAverage;
        
        if (difference > 0.5) {
          weeklyTrend = 'improving';
        } else if (difference < -0.5) {
          weeklyTrend = 'declining';
        }
      }

      return {
        averageMood: Math.round(averageMood * 10) / 10,
        weeklyTrend,
        totalEntries: entries.length,
      };
    } catch (error) {
      console.error('Fetch mood analytics error:', error);
      return {
        averageMood: 0,
        weeklyTrend: 'stable',
        totalEntries: 0,
      };
    }
  }

  async getChartData(days: number = 7): Promise<Array<{
    date: Date;
    mood: number | null;
    energy: number | null;
    calm: number | null;
    relaxed: number | null;
  }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('mood_score, notes, entry_date')
        .eq('user_id', user.id)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .lte('entry_date', endDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: true });

      if (error) {
        console.error('Fetch chart data error:', error);
        throw error;
      }

      const entries = data || [];
      
      // Generate chart data for the last N days
      const chartPoints = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const moodEntry = entries.find(e => e.entry_date === dateStr);
        
        if (moodEntry) {
          const parsed = this._parseMoodEntryNotes(moodEntry);
          chartPoints.push({
            date: date,
            mood: parsed.parsed.moodScore,
            energy: parsed.parsed.energyLevel,
            calm: 11 - parsed.parsed.anxietyLevel, // Invert anxiety to calm
            relaxed: 11 - parsed.parsed.stressLevel, // Invert stress to relaxed
          });
        } else {
          chartPoints.push({
            date: date,
            mood: null,
            energy: null,
            calm: null,
            relaxed: null,
          });
        }
      }

      return chartPoints;
    } catch (error) {
      console.error('Fetch chart data error:', error);
      return [];
    }
  }
}

export const moodService = new MoodService();