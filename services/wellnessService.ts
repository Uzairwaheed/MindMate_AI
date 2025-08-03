import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type WellnessGoal = Database['public']['Tables']['wellness_goals']['Row'];
type WellnessGoalInsert = Database['public']['Tables']['wellness_goals']['Insert'];
type GoalCompletion = Database['public']['Tables']['goal_completions']['Row'];
type QuizResult = Database['public']['Tables']['quiz_results']['Row'];
type QuizResultInsert = Database['public']['Tables']['quiz_results']['Insert'];

export interface CreateGoalData {
  title: string;
  description?: string;
  targetFrequency?: 'daily' | 'weekly' | 'monthly';
}

export interface QuizSubmissionData {
  quizType: string;
  answers: any[];
  totalScore: number;
}

export interface TherapyRecommendation {
  severity: 'low' | 'moderate' | 'high';
  recommendations: string[];
  resources: {
    title: string;
    description: string;
    url?: string;
    phone?: string;
  }[];
}

class WellnessService {
  // Create a wellness goal
  async createGoal(goalData: CreateGoalData): Promise<WellnessGoal> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const insertData: WellnessGoalInsert = {
        user_id: user.id,
        title: goalData.title,
        description: goalData.description || '',
        target_frequency: goalData.targetFrequency || 'daily',
      };

      const { data, error } = await supabase
        .from('wellness_goals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create goal error:', error);
      throw error;
    }
  }

  // Get user's wellness goals
  async getUserGoals(): Promise<WellnessGoal[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('wellness_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get goals error:', error);
      throw error;
    }
  }

  // Complete a goal
  async completeGoal(goalId: string, notes?: string): Promise<GoalCompletion> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('goal_completions')
        .insert({
          goal_id: goalId,
          user_id: user.id,
          notes: notes || '',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Complete goal error:', error);
      throw error;
    }
  }

  // Submit quiz results
  async submitQuizResults(quizData: QuizSubmissionData): Promise<QuizResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const severityLevel = this.calculateSeverityLevel(quizData.quizType, quizData.totalScore);

      const insertData: QuizResultInsert = {
        user_id: user.id,
        quiz_type: quizData.quizType,
        total_score: quizData.totalScore,
        severity_level: severityLevel,
        answers: quizData.answers,
      };

      const { data, error } = await supabase
        .from('quiz_results')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Submit quiz results error:', error);
      throw error;
    }
  }

  // Get therapy recommendations based on user data
  async getTherapyRecommendations(): Promise<TherapyRecommendation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get latest quiz results
      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get recent mood data
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('mood_score')
        .eq('user_id', user.id)
        .gte('entry_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('entry_date', { ascending: false });

      // Calculate severity based on available data
      let severity: 'low' | 'moderate' | 'high' = 'low';
      
      if (quizResults && quizResults.length > 0) {
        const latestQuiz = quizResults[0];
        if (latestQuiz.severity_level === 'Moderate to Severe') {
          severity = 'high';
        } else if (latestQuiz.severity_level === 'Mild') {
          severity = 'moderate';
        }
      }

      if (moodEntries && moodEntries.length > 0) {
        const avgMood = moodEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / moodEntries.length;
        if (avgMood <= 2) severity = 'high';
        else if (avgMood <= 3) severity = 'moderate';
      }

      return this.generateRecommendations(severity);
    } catch (error) {
      console.error('Get therapy recommendations error:', error);
      throw error;
    }
  }

  // Calculate severity level based on quiz type and score
  private calculateSeverityLevel(quizType: string, score: number): string {
    switch (quizType) {
      case 'GAD-7':
        if (score <= 4) return 'Minimal';
        if (score <= 9) return 'Mild';
        if (score <= 14) return 'Moderate';
        return 'Severe';
      
      case 'PHQ-9':
        if (score <= 4) return 'Minimal';
        if (score <= 9) return 'Mild';
        if (score <= 14) return 'Moderate';
        if (score <= 19) return 'Moderately Severe';
        return 'Severe';
      
      default:
        if (score <= 4) return 'Minimal';
        if (score <= 9) return 'Mild';
        return 'Moderate to Severe';
    }
  }

  // Generate therapy recommendations based on severity
  private generateRecommendations(severity: 'low' | 'moderate' | 'high'): TherapyRecommendation {
    const baseResources = [
      {
        title: 'National Suicide Prevention Lifeline',
        description: '24/7 crisis support',
        phone: '988',
      },
      {
        title: 'Crisis Text Line',
        description: 'Free 24/7 crisis counseling',
        phone: '741741',
      },
      {
        title: 'Psychology Today',
        description: 'Find therapists in your area',
        url: 'https://www.psychologytoday.com',
      },
    ];

    switch (severity) {
      case 'high':
        return {
          severity,
          recommendations: [
            'Consider speaking with a mental health professional immediately',
            'Reach out to trusted friends or family members',
            'Contact crisis support services if needed',
            'Avoid making major life decisions while distressed',
          ],
          resources: baseResources,
        };
      
      case 'moderate':
        return {
          severity,
          recommendations: [
            'Consider scheduling an appointment with a therapist',
            'Practice daily mindfulness or meditation',
            'Maintain regular exercise and sleep schedules',
            'Connect with supportive friends and family',
          ],
          resources: baseResources.slice(2), // Remove crisis resources
        };
      
      default:
        return {
          severity,
          recommendations: [
            'Continue with current self-care practices',
            'Consider preventive mental health strategies',
            'Maintain healthy lifestyle habits',
            'Stay connected with your support network',
          ],
          resources: [baseResources[2]], // Only therapy finder
        };
    }
  }

  // Get goal completion statistics
  async getGoalStatistics(): Promise<{
    totalGoals: number;
    completedToday: number;
    currentStreak: number;
    completionRate: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const today = new Date().toISOString().split('T')[0];

      // Get total active goals
      const { count: totalGoals } = await supabase
        .from('wellness_goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Get completions for today
      const { count: completedToday } = await supabase
        .from('goal_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed_date', today);

      // Calculate streak and completion rate (simplified)
      const { data: recentCompletions } = await supabase
        .from('goal_completions')
        .select('completed_date')
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false })
        .limit(30);

      let currentStreak = 0;
      let completionRate = 0;

      if (recentCompletions && recentCompletions.length > 0) {
        // Calculate basic completion rate
        const uniqueDates = new Set(recentCompletions.map(c => c.completed_date));
        completionRate = (uniqueDates.size / 30) * 100;

        // Calculate current streak (simplified)
        const dates = Array.from(uniqueDates).sort().reverse();
        let currentDate = new Date(today);
        
        for (const date of dates) {
          if (date === currentDate.toISOString().split('T')[0]) {
            currentStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return {
        totalGoals: totalGoals || 0,
        completedToday: completedToday || 0,
        currentStreak,
        completionRate: Math.round(completionRate),
      };
    } catch (error) {
      console.error('Get goal statistics error:', error);
      throw error;
    }
  }
}

export const wellnessService = new WellnessService();