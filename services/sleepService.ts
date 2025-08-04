import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type SleepEntry = Database['public']['Tables']['sleep_entries']['Row'];
type SleepEntryInsert = Database['public']['Tables']['sleep_entries']['Insert'];
type SleepEntryUpdate = Database['public']['Tables']['sleep_entries']['Update'];

export interface CreateSleepEntryData {
  bedtime: string; // HH:MM format
  wakeTime: string; // HH:MM format
  sleepQuality: number; // 1-10 scale
  moodAfterSleep: string;
  notes?: string;
  entryDate?: string;
}

export interface SleepAnalytics {
  weeklyAverage: number;
  qualityAverage: number;
  consistency: number;
  totalEntries: number;
  insights: string[];
  moodCorrelation?: {
    averageMoodWith7Plus: number;
    averageMoodWithLess7: number;
    correlation: 'positive' | 'negative' | 'neutral';
  };
}

export interface SleepChartData {
  date: Date;
  duration: number | null;
  quality: number | null;
  bedtime: string | null;
  wakeTime: string | null;
  mood?: number | null;
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
    return Math.round((durationMinutes / 60) * 100) / 100; // Round to 2 decimals
  }

  // Create a new sleep entry
  async createSleepEntry(entryData: CreateSleepEntryData): Promise<SleepEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const duration = this.calculateDuration(entryData.bedtime, entryData.wakeTime);

      const insertData: SleepEntryInsert = {
        user_id: user.id,
        bedtime: entryData.bedtime,
        wake_time: entryData.wakeTime,
        sleep_duration: duration,
        sleep_quality: entryData.sleepQuality,
        mood_after_sleep: entryData.moodAfterSleep,
        notes: entryData.notes || '',
        entry_date: entryData.entryDate || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('sleep_entries')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create sleep entry error:', error);
      throw error;
    }
  }

  // Get user's sleep entries
  async getUserSleepEntries(limit?: number): Promise<SleepEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('sleep_entries')
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
      console.error('Get sleep entries error:', error);
      throw error;
    }
  }

  // Get sleep entries for date range
  async getSleepEntriesByDateRange(startDate: string, endDate: string): Promise<SleepEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get sleep entries by date range error:', error);
      throw error;
    }
  }

  // Update sleep entry
  async updateSleepEntry(entryId: string, updateData: Partial<CreateSleepEntryData>): Promise<SleepEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const updatePayload: SleepEntryUpdate = {};

      if (updateData.bedtime) updatePayload.bedtime = updateData.bedtime;
      if (updateData.wakeTime) updatePayload.wake_time = updateData.wakeTime;
      if (updateData.sleepQuality) updatePayload.sleep_quality = updateData.sleepQuality;
      if (updateData.moodAfterSleep) updatePayload.mood_after_sleep = updateData.moodAfterSleep;
      if (updateData.notes !== undefined) updatePayload.notes = updateData.notes;
      if (updateData.entryDate) updatePayload.entry_date = updateData.entryDate;

      // Recalculate duration if times changed
      if (updateData.bedtime || updateData.wakeTime) {
        const currentEntry = await this.getSleepEntry(entryId);
        const bedtime = updateData.bedtime || currentEntry.bedtime;
        const wakeTime = updateData.wakeTime || currentEntry.wake_time;
        updatePayload.sleep_duration = this.calculateDuration(bedtime, wakeTime);
      }

      const { data, error } = await supabase
        .from('sleep_entries')
        .update(updatePayload)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update sleep entry error:', error);
      throw error;
    }
  }

  // Get single sleep entry
  async getSleepEntry(entryId: string): Promise<SleepEntry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get sleep entry error:', error);
      throw error;
    }
  }

  // Delete sleep entry
  async deleteSleepEntry(entryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('sleep_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete sleep entry error:', error);
      throw error;
    }
  }

  // Get sleep analytics
  async getSleepAnalytics(days: number = 7): Promise<SleepAnalytics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const entries = await this.getSleepEntriesByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (entries.length === 0) {
        return {
          weeklyAverage: 0,
          qualityAverage: 0,
          consistency: 0,
          totalEntries: 0,
          insights: ['No sleep data available yet. Start logging your sleep to see insights!'],
        };
      }

      // Calculate averages
      const weeklyAverage = entries.reduce((sum, entry) => sum + entry.sleep_duration, 0) / entries.length;
      const qualityAverage = entries.reduce((sum, entry) => sum + entry.sleep_quality, 0) / entries.length;

      // Calculate consistency (lower variance = higher consistency)
      const avgBedtime = this.calculateAverageTime(entries.map(e => e.bedtime));
      const avgWakeTime = this.calculateAverageTime(entries.map(e => e.wake_time));
      const bedtimeVariance = this.calculateTimeVariance(entries.map(e => e.bedtime), avgBedtime);
      const wakeTimeVariance = this.calculateTimeVariance(entries.map(e => e.wake_time), avgWakeTime);
      const consistency = Math.max(0, 100 - (bedtimeVariance + wakeTimeVariance) * 10);

      // Get mood correlation if mood data exists
      const moodCorrelation = await this.getMoodSleepCorrelation(entries);

      // Generate insights
      const insights = this.generateInsights(entries, weeklyAverage, qualityAverage, moodCorrelation);

      return {
        weeklyAverage: Math.round(weeklyAverage * 100) / 100,
        qualityAverage: Math.round(qualityAverage * 10) / 10,
        consistency: Math.round(consistency),
        totalEntries: entries.length,
        insights,
        moodCorrelation,
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

  // Enhanced analytics for Sleep Insights screen
  async getSleepInsights(days: number = 7): Promise<{
    chartData: SleepChartData[];
    averageDuration: number;
    sleepScore: number;
    trend: 'up' | 'down' | 'stable';
    qualityBreakdown: {
      deep: number;
      light: number;
      awake: number;
    };
    recentEntries: SleepEntry[];
  }> {
    try {
      const [analytics, chartData, recentEntries] = await Promise.all([
        this.getSleepAnalytics(days),
        this.getChartData(days),
        this.getUserSleepEntries(5)
      ]);

      // Calculate comprehensive sleep score (0-100)
      const durationScore = Math.min((analytics.weeklyAverage / 8) * 100, 100);
      const qualityScore = (analytics.qualityAverage / 10) * 100;
      const consistencyScore = analytics.consistency;
      
      const sleepScore = Math.round(
        (durationScore * 0.4) + // 40% weight for duration
        (qualityScore * 0.35) + // 35% weight for quality
        (consistencyScore * 0.25) // 25% weight for consistency
      );

      // Calculate trend from chart data
      const recentData = chartData.slice(-3).filter(d => d.duration !== null);
      const earlierData = chartData.slice(0, 3).filter(d => d.duration !== null);
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      
      if (recentData.length > 0 && earlierData.length > 0) {
        const recentAvg = recentData.reduce((sum, d) => sum + (d.duration || 0), 0) / recentData.length;
        const earlierAvg = earlierData.reduce((sum, d) => sum + (d.duration || 0), 0) / earlierData.length;
        
        if (recentAvg > earlierAvg + 0.5) trend = 'up';
        else if (recentAvg < earlierAvg - 0.5) trend = 'down';
      }

      // Generate quality breakdown based on sleep quality scores
      const qualityBreakdown = this.generateQualityBreakdown(analytics.qualityAverage);

      return {
        chartData,
        averageDuration: analytics.weeklyAverage,
        sleepScore,
        trend,
        qualityBreakdown,
        recentEntries,
      };
    } catch (error) {
      console.error('Get sleep insights error:', error);
      throw error;
    }
  }

  // Generate sleep stage breakdown from quality data
  private generateQualityBreakdown(avgQuality: number): {
    deep: number;
    light: number;
    awake: number;
  } {
    // Base percentages for average sleep
    const baseDeep = 22;
    const baseLight = 65;
    const baseAwake = 13;

    // Adjust based on quality score (1-10 scale)
    const qualityFactor = (avgQuality - 5.5) / 4.5; // Normalize to -1 to 1
    
    // Higher quality = more deep sleep, less awake time
    const deep = Math.max(15, Math.min(35, baseDeep + (qualityFactor * 8)));
    const awake = Math.max(5, Math.min(25, baseAwake - (qualityFactor * 6)));
    const light = 100 - deep - awake;

    return {
      deep: Math.round(deep),
      light: Math.round(light),
      awake: Math.round(awake),
    };
  }

  // Get chart data for visualization
  async getChartData(days: number = 7): Promise<SleepChartData[]> {
    try {
      const chartPoints: SleepChartData[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const entries = await this.getSleepEntriesByDateRange(dateStr, dateStr);
        const sleepEntry = entries[0] || null;
        
        // Get mood data for correlation
        let moodScore = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: moodEntries } = await supabase
              .from('mood_entries')
              .select('mood_score')
              .eq('user_id', user.id)
              .eq('entry_date', dateStr)
              .limit(1);
            
            if (moodEntries && moodEntries.length > 0) {
              moodScore = moodEntries[0].mood_score * 2; // Convert 1-5 to 1-10 scale
            }
          }
        } catch (error) {
          // Mood data is optional, continue without it
        }
        
        chartPoints.push({
          date: date,
          duration: sleepEntry?.sleep_duration || null,
          quality: sleepEntry?.sleep_quality || null,
          bedtime: sleepEntry?.bedtime || null,
          wakeTime: sleepEntry?.wake_time || null,
          mood: moodScore,
        });
      }

      return chartPoints;
    } catch (error) {
      console.error('Get chart data error:', error);
      return [];
    }
  }

  // Get mood-sleep correlation
  private async getMoodSleepCorrelation(sleepEntries: SleepEntry[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return undefined;

      // Get mood entries for the same dates
      const dates = sleepEntries.map(e => e.entry_date);
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('mood_score, entry_date')
        .eq('user_id', user.id)
        .in('entry_date', dates);

      if (!moodEntries || moodEntries.length < 3) return undefined;

      // Calculate correlation
      const sleepWith7Plus = sleepEntries.filter(e => e.sleep_duration >= 7);
      const sleepWithLess7 = sleepEntries.filter(e => e.sleep_duration < 7);

      const moodWith7Plus = moodEntries.filter(m => {
        const sleepEntry = sleepEntries.find(s => s.entry_date === m.entry_date);
        return sleepEntry && sleepEntry.sleep_duration >= 7;
      });

      const moodWithLess7 = moodEntries.filter(m => {
        const sleepEntry = sleepEntries.find(s => s.entry_date === m.entry_date);
        return sleepEntry && sleepEntry.sleep_duration < 7;
      });

      if (moodWith7Plus.length === 0 || moodWithLess7.length === 0) return undefined;

      const avgMoodWith7Plus = moodWith7Plus.reduce((sum, m) => sum + m.mood_score * 2, 0) / moodWith7Plus.length;
      const avgMoodWithLess7 = moodWithLess7.reduce((sum, m) => sum + m.mood_score * 2, 0) / moodWithLess7.length;

      const difference = avgMoodWith7Plus - avgMoodWithLess7;
      let correlation: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (difference > 0.5) correlation = 'positive';
      else if (difference < -0.5) correlation = 'negative';

      return {
        averageMoodWith7Plus: Math.round(avgMoodWith7Plus * 10) / 10,
        averageMoodWithLess7: Math.round(avgMoodWithLess7 * 10) / 10,
        correlation,
      };
    } catch (error) {
      console.error('Get mood correlation error:', error);
      return undefined;
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

  private generateInsights(
    entries: SleepEntry[], 
    avgDuration: number, 
    avgQuality: number,
    moodCorrelation?: any
  ): string[] {
    const insights = [];
    
    // Duration insights
    if (avgDuration < 7) {
      insights.push('You might benefit from getting more sleep. Aim for 7-9 hours per night.');
    } else if (avgDuration > 9) {
      insights.push('You\'re getting plenty of sleep! Make sure the quality is good too.');
    } else {
      insights.push('Great job maintaining a healthy sleep duration!');
    }

    // Quality insights
    if (avgQuality < 5) {
      insights.push('Your sleep quality could be improved. Consider a consistent bedtime routine.');
    } else if (avgQuality >= 7) {
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

    // Mood correlation insights
    if (moodCorrelation && moodCorrelation.correlation === 'positive') {
      insights.push('Your mood is better when you get 7+ hours of sleep. Prioritize adequate rest!');
    } else if (moodCorrelation && moodCorrelation.correlation === 'negative') {
      insights.push('Interestingly, your mood doesn\'t seem directly tied to sleep duration. Other factors may be at play.');
    }

    return insights;
  }

  // Format duration for display
  formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  // Get quality text
  getQualityText(quality: number): string {
    if (quality <= 2) return 'Poor';
    if (quality <= 4) return 'Fair';
    if (quality <= 6) return 'Good';
    if (quality <= 8) return 'Very Good';
    return 'Excellent';
  }

  // Get quality color
  getQualityColor(quality: number): string {
    if (quality <= 3) return '#EF4444';
    if (quality <= 6) return '#F59E0B';
    return '#10B981';
  }
}

export const sleepService = new SleepService();