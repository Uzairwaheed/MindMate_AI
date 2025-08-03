export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          age: number | null;
          gender: string | null;
          occupation: string | null;
          mental_health_concerns: string[];
          profile_picture_url: string | null;
          oauth_provider: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          age?: number | null;
          gender?: string | null;
          occupation?: string | null;
          mental_health_concerns?: string[];
          profile_picture_url?: string | null;
          oauth_provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          age?: number | null;
          gender?: string | null;
          occupation?: string | null;
          mental_health_concerns?: string[];
          profile_picture_url?: string | null;
          oauth_provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          sentiment_score: number;
          mood_rating: number | null;
          entry_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content: string;
          sentiment_score?: number;
          mood_rating?: number | null;
          entry_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          sentiment_score?: number;
          mood_rating?: number | null;
          entry_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          mood_score: number;
          emotions: string[];
          notes: string;
          entry_date: string;
          entry_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mood_score: number;
          emotions?: string[];
          notes?: string;
          entry_date?: string;
          entry_time?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mood_score?: number;
          emotions?: string[];
          notes?: string;
          entry_date?: string;
          entry_time?: string;
          created_at?: string;
        };
      };
      sentiment_analyses: {
        Row: {
          id: string;
          user_id: string;
          image_url: string | null;
          detected_emotion: string;
          confidence_score: number;
          analysis_result: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url?: string | null;
          detected_emotion: string;
          confidence_score?: number;
          analysis_result?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string | null;
          detected_emotion?: string;
          confidence_score?: number;
          analysis_result?: any;
          created_at?: string;
        };
      };
      wellness_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          target_frequency: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          target_frequency?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          target_frequency?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      goal_completions: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          completed_date: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          completed_date?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          completed_date?: string;
          notes?: string;
          created_at?: string;
        };
      };
      quiz_results: {
        Row: {
          id: string;
          user_id: string;
          quiz_type: string;
          total_score: number;
          severity_level: string;
          answers: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_type: string;
          total_score: number;
          severity_level: string;
          answers?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_type?: string;
          total_score?: number;
          severity_level?: string;
          answers?: any;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}