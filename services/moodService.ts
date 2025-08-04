import { supabase } from '@/lib/supabase';

interface MoodEntry {
  id?: string;
  user_id?: string;
  mood_score: number;
  emotions?: string[];
  notes?: string;
  entry_date?: string;
  entry_time?: string;
  created_at?: string;
}

interface CreateMoodEntryData {
  moodScore: number;
  emotions?: string[];
  notes?: string;
  entryDate?: string;
  entryTime?: string;
}

interface UpdateMoodEntryData {
  moodScore?: number;
  emotions?: string[];
  notes?: string;
  entryDate?: string;
  entryTime?: string;
}

class MoodService {
  async createMoodEntry(entryData: CreateMoodEntryData): Promise<MoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Convert 1-10 scale to 1-5 scale for database constraint
      const moodScore = Math.ceil(entryData.moodScore / 2);

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_score: moodScore,
          emotions: entryData.emotions || [],
          notes: entryData.notes || '',
          entry_date: entryData.entryDate || new Date().toISOString().split('T')[0],
          entry_time: entryData.entryTime || new Date().toTimeString().split(' ')[0],
        })
        .select()
        .single();

      if (error) {
        console.error('Create mood entry error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create mood entry error:', error);
      throw error;
    }
  }

  async getUserMoodEntries(limit?: number): Promise<MoodEntry[]> {
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

      return data || [];
    } catch (error) {
      console.error('Fetch mood entries error:', error);
      throw error;
    }
  }

  async updateMoodEntry(entryId: string, updateData: UpdateMoodEntryData): Promise<MoodEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const updatePayload: any = {};

      if (updateData.moodScore !== undefined) {
        // Convert 1-10 scale to 1-5 scale for database constraint
        updatePayload.mood_score = Math.ceil(updateData.moodScore / 2);
      }

      if (updateData.emotions !== undefined) {
        updatePayload.emotions = updateData.emotions;
      }

      if (updateData.notes !== undefined) {
        updatePayload.notes = updateData.notes;
      }

      if (updateData.entryDate !== undefined) {
        updatePayload.entry_date = updateData.entryDate;
      }

      if (updateData.entryTime !== undefined) {
        updatePayload.entry_time = updateData.entryTime;
      }

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

      return data;
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

  async getMoodAnalytics(days: number = 7): Promise<{
    averageMood: number;
    trend: 'improving' | 'declining' | 'stable';
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

      const { data, error } = await supabase
        .from('mood_entries')
        .select('mood_score, entry_date')
        .eq('user_id', user.id)
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .lte('entry_date', endDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: true });

      if (error) {
        console.error('Fetch mood analytics error:', error);
        throw error;
      }

      const entries = data || [];
      
      if (entries.length === 0) {
        return {
          averageMood: 0,
          trend: 'stable',
          totalEntries: 0,
        };
      }

      // Calculate average mood (convert back to 1-10 scale)
      const averageMood = entries.reduce((sum, entry) => sum + (entry.mood_score * 2), 0) / entries.length;

      // Calculate trend
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      
      if (entries.length >= 3) {
        const firstHalf = entries.slice(0, Math.floor(entries.length / 2));
        const secondHalf = entries.slice(Math.floor(entries.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.mood_score, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.mood_score, 0) / secondHalf.length;
        
        const difference = secondHalfAvg - firstHalfAvg;
        
        if (difference > 0.3) {
          trend = 'improving';
        } else if (difference < -0.3) {
          trend = 'declining';
        }
      }

      return {
        averageMood: Math.round(averageMood * 10) / 10,
        trend,
        totalEntries: entries.length,
      };
    } catch (error) {
      console.error('Fetch mood analytics error:', error);
      return {
        averageMood: 0,
        trend: 'stable',
        totalEntries: 0,
      };
    }
  }

  async getChartData(days: number = 7): Promise<Array<{
    date: string;
    mood: number;
    energy: number;
    calm: number;
    relaxed: number;
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
      
      // Parse notes to extract slider values
      return entries.map(entry => {
        let energy = entry.mood_score * 2; // Default fallback
        let calm = entry.mood_score * 2;
        let relaxed = entry.mood_score * 2;

        // Try to parse slider values from notes
        if (entry.notes) {
          const energyMatch = entry.notes.match(/Energy:\s*(\d+)/);
          const anxietyMatch = entry.notes.match(/Anxiety:\s*(\d+)/);
          const stressMatch = entry.notes.match(/Stress:\s*(\d+)/);
          const sleepMatch = entry.notes.match(/Sleep:\s*(\d+)/);

          if (energyMatch) energy = parseInt(energyMatch[1]);
          if (anxietyMatch) calm = 11 - parseInt(anxietyMatch[1]); // Invert anxiety to calm
          if (stressMatch) relaxed = 11 - parseInt(stressMatch[1]); // Invert stress to relaxed
        }

        return {
          date: entry.entry_date,
          mood: entry.mood_score * 2, // Convert back to 1-10 scale
          energy,
          calm,
          relaxed,
        };
      });
    } catch (error) {
      console.error('Fetch chart data error:', error);
      return [];
    }
  }
}

export const moodService = new MoodService();