import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

export interface CreateSleepEntryData {
  bedtime: string; // HH:MM format
  wakeTime: string; // HH:MM format
  sleepQuality: number; // 1-5 scale
  moodAfterSleep: string;
  notes?: string;
  entryDate?: string;
}

export interface SleepEntry {
  id: string;
  user_id: string;
  bedtime: string;
  wake_time: string;
  sleep_duration: number; // in hours
  sleep_quality: number;
  mood_after_sleep: string;
  notes: string;
  entry_date: string;
  created_at: string;
}

export interface SleepAnalytics {
  weeklyAverage: number;
  qualityAverage: number;
  consistency: number;
  totalEntries: number;
  insights: string[];
}

class SleepService {
  // Calculate sleep duration in hours
  private calculateDuration(bedtime: string, wakeTime: string): number {
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    let bedTimeMinutes = bedHour * 60 + bedMin;
    let wakeTimeMinutes = wakeHour * 60 + wakeMin;
    
    // Handle overnight sleep (bedtime after midnight)
    if (wakeTimeMinutes < bedTimeMinutes) {
      wakeTimeMinutes += 24 * 60; // Add 24 hours
    }
    
    const durationMinutes = wakeTimeMinutes - bedTimeMinutes;
    return Math.round((durationMinutes / 60) * 10) / 10; // Round to 1 decimal
  }

  // Create a new sleep entry
  async createSleepEntry(entryData: CreateSleepEntryData): Promise<SleepEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const duration = this.calculateDuration(entryData.bedtime, entryData.wakeTime);

      // Store in mood_entries table with formatted notes
      const formattedNotes = `Sleep: ${entryData.bedtime}-${entryData.wakeTime} | Quality: ${entryData.sleepQuality} | Mood: ${entryData.moodAfterSleep}${entryData.notes ? ` | Notes: ${entryData.notes}` : ''}`;

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_score: Math.ceil(entryData.sleepQuality), // Use quality as mood score
          emotions: ['Sleep'],
          notes: formattedNotes,
          entry_date: entryData.entryDate || new Date().toISOString().split('T')[0],
          entry_time: entryData.wakeTime,
        })
        .select()
        .single();

      if (error) throw error;

      // Return formatted sleep entry
      return {
        id: data.id,
        user_id: data.user_id,
        bedtime: entryData.bedtime,
        wake_time: entryData.wakeTime,
        sleep_duration: duration,
        sleep_quality: entryData.sleepQuality,
        mood_after_sleep: entryData.moodAfterSleep,
        notes: entryData.notes || '',
        entry_date: data.entry_date,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error('Create sleep entry error:', error);
      throw error;
    }
  }

  // Parse sleep data from mood_entries
  private parseSleepEntry(moodEntry: any): SleepEntry | null {
    if (!moodEntry.emotions.includes('Sleep')) return null;

    const notes = moodEntry.notes || '';
    const sleepMatch = notes.match(/Sleep:\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    const qualityMatch = notes.match(/Quality:\s*(\d+)/);
    const moodMatch = notes.match(/Mood:\s*([^|]+)/);
    const notesMatch = notes.match(/Notes:\s*(.+?)(?:\s*\||$)/);

    if (!sleepMatch) return null;

    const bedtime = sleepMatch[1];
    const wakeTime = sleepMatch[2];
    const duration = this.calculateDuration(bedtime, wakeTime);

    return {
      id: moodEntry.id,
      user_id: moodEntry.user_id,
      bedtime,
      wake_time: wakeTime,
      sleep_duration: duration,
      sleep_quality: qualityMatch ? parseInt(qualityMatch[1]) : moodEntry.mood_score,
      mood_after_sleep: moodMatch ? moodMatch[1].trim() : 'Good',
      notes: notesMatch ? notesMatch[1].trim() : '',
      entry_date: moodEntry.entry_date,
      created_at: moodEntry.created_at,
    };
  }

  // Get user's sleep entries
  async getUserSleepEntries(limit?: number): Promise<SleepEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .contains('emotions', ['Sleep'])
        .order('entry_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || [])
        .map(entry => this.parseSleepEntry(entry))
        .filter((entry): entry is SleepEntry => entry !== null);
    } catch (error) {
      console.error('Get sleep entries error:', error);
      throw error;
    }
  }

  // Get sleep analytics
  async getSleepAnalytics(days: number = 7): Promise<SleepAnalytics> {
    try {
      const entries = await this.getUserSleepEntries();
      
      if (entries.length === 0) {
        return {
          weeklyAverage: 0,
          qualityAverage: 0,
          consistency: 0,
          totalEntries: 0,
          insights: ['No sleep data available yet. Start logging your sleep to see insights!'],
        };
      }

      // Filter entries for the specified period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const recentEntries = entries.filter(entry => 
        new Date(entry.entry_date) >= cutoffDate
      );

      if (recentEntries.length === 0) {
        return {
          weeklyAverage: 0,
          qualityAverage: 0,
          consistency: 0,
          totalEntries: entries.length,
          insights: ['No recent sleep data. Log your sleep to see trends!'],
        };
      }

      // Calculate averages
      const weeklyAverage = recentEntries.reduce((sum, entry) => sum + entry.sleep_duration, 0) / recentEntries.length;
      const qualityAverage = recentEntries.reduce((sum, entry) => sum + entry.sleep_quality, 0) / recentEntries.length;

      // Calculate consistency (lower variance = higher consistency)
      const avgBedtime = this.calculateAverageTime(recentEntries.map(e => e.bedtime));
      const avgWakeTime = this.calculateAverageTime(recentEntries.map(e => e.wake_time));
      const bedtimeVariance = this.calculateTimeVariance(recentEntries.map(e => e.bedtime), avgBedtime);
      const wakeTimeVariance = this.calculateTimeVariance(recentEntries.map(e => e.wake_time), avgWakeTime);
      const consistency = Math.max(0, 100 - (bedtimeVariance + wakeTimeVariance) * 10);

      // Generate insights
      const insights = this.generateInsights(recentEntries, weeklyAverage, qualityAverage);

      return {
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        qualityAverage: Math.round(qualityAverage * 10) / 10,
        consistency: Math.round(consistency),
        totalEntries: entries.length,
        insights,
      };
    } catch (error) {
      console.error('Get sleep analytics error:', error);
      return {
        weeklyAverage: 0,
        qualityAverage: 0,
        consistency: 0,
        totalEntries: 0,
        insights: ['Error loading sleep analytics'],
      };
    }
  }

  // Get chart data for visualization
  async getChartData(days: number = 7): Promise<Array<{
    date: Date;
    duration: number | null;
    quality: number | null;
    bedtime: string | null;
    wakeTime: string | null;
  }>> {
    try {
      const entries = await this.getUserSleepEntries();
      const chartPoints = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const sleepEntry = entries.find(e => e.entry_date === dateStr);
        
        chartPoints.push({
          date: date,
          duration: sleepEntry?.sleep_duration || null,
          quality: sleepEntry?.sleep_quality || null,
          bedtime: sleepEntry?.bedtime || null,
          wakeTime: sleepEntry?.wake_time || null,
        });
      }

      return chartPoints;
    } catch (error) {
      console.error('Get chart data error:', error);
      return [];
    }
  }

  // Helper methods
  private calculateAverageTime(times: string[]): string {
    const totalMinutes = times.reduce((sum, time) => {
      const [hour, min] = time.split(':').map(Number);
      return sum + (hour * 60 + min);
    }, 0);
    
    const avgMinutes = totalMinutes / times.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private calculateTimeVariance(times: string[], average: string): number {
    const [avgHour, avgMin] = average.split(':').map(Number);
    const avgTotalMin = avgHour * 60 + avgMin;
    
    const variance = times.reduce((sum, time) => {
      const [hour, min] = time.split(':').map(Number);
      const totalMin = hour * 60 + min;
      const diff = Math.abs(totalMin - avgTotalMin);
      return sum + (diff > 720 ? 1440 - diff : diff); // Handle day boundary
    }, 0) / times.length;
    
    return variance / 60; // Convert to hours
  }

  private generateInsights(entries: SleepEntry[], avgDuration: number, avgQuality: number): string[] {
    const insights = [];
    
    if (avgDuration < 7) {
      insights.push('You might benefit from getting more sleep. Aim for 7-9 hours per night.');
    } else if (avgDuration > 9) {
      insights.push('You\'re getting plenty of sleep! Make sure the quality is good too.');
    } else {
      insights.push('Great job maintaining a healthy sleep duration!');
    }

    if (avgQuality < 3) {
      insights.push('Your sleep quality could be improved. Consider a consistent bedtime routine.');
    } else if (avgQuality >= 4) {
      insights.push('Excellent sleep quality! Keep up the good habits.');
    }

    // Weekend vs weekday analysis
    const weekendEntries = entries.filter(e => {
      const day = new Date(e.entry_date).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });
    
    const weekdayEntries = entries.filter(e => {
      const day = new Date(e.entry_date).getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });

    if (weekendEntries.length > 0 && weekdayEntries.length > 0) {
      const weekendAvg = weekendEntries.reduce((sum, e) => sum + e.sleep_duration, 0) / weekendEntries.length;
      const weekdayAvg = weekdayEntries.reduce((sum, e) => sum + e.sleep_duration, 0) / weekdayEntries.length;
      
      if (Math.abs(weekendAvg - weekdayAvg) > 1) {
        if (weekendAvg > weekdayAvg) {
          insights.push('You sleep more on weekends. Try to maintain consistent sleep on weekdays.');
        } else {
          insights.push('You sleep less on weekends. Consider prioritizing rest during your days off.');
        }
      }
    }

    return insights;
  }

  // Update sleep entry
  async updateSleepEntry(entryId: string, updateData: Partial<CreateSleepEntryData>): Promise<SleepEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get current entry to merge data
      const { data: currentEntry, error: fetchError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentSleep = this.parseSleepEntry(currentEntry);
      if (!currentSleep) throw new Error('Entry is not a sleep entry');

      // Merge update data with current data
      const mergedData = {
        bedtime: updateData.bedtime || currentSleep.bedtime,
        wakeTime: updateData.wakeTime || currentSleep.wake_time,
        sleepQuality: updateData.sleepQuality || currentSleep.sleep_quality,
        moodAfterSleep: updateData.moodAfterSleep || currentSleep.mood_after_sleep,
        notes: updateData.notes !== undefined ? updateData.notes : currentSleep.notes,
      };

      const duration = this.calculateDuration(mergedData.bedtime, mergedData.wakeTime);
      const formattedNotes = `Sleep: ${mergedData.bedtime}-${mergedData.wakeTime} | Quality: ${mergedData.sleepQuality} | Mood: ${mergedData.moodAfterSleep}${mergedData.notes ? ` | Notes: ${mergedData.notes}` : ''}`;

      const { data, error } = await supabase
        .from('mood_entries')
        .update({
          mood_score: Math.ceil(mergedData.sleepQuality),
          notes: formattedNotes,
          entry_time: mergedData.wakeTime,
        })
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id,
        bedtime: mergedData.bedtime,
        wake_time: mergedData.wakeTime,
        sleep_duration: duration,
        sleep_quality: mergedData.sleepQuality,
        mood_after_sleep: mergedData.moodAfterSleep,
        notes: mergedData.notes,
        entry_date: data.entry_date,
        created_at: data.created_at,
      };
    } catch (error) {
      console.error('Update sleep entry error:', error);
      throw error;
    }
  }

  // Delete sleep entry
  async deleteSleepEntry(entryId: string): Promise<void> {
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
      console.error('Delete sleep entry error:', error);
      throw error;
    }
  }
}

export const sleepService = new SleepService();