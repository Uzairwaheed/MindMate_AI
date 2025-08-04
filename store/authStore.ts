import { create } from 'zustand';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePictureUrl?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  concerns?: string[];
  oauthProvider?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  greeting: string;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  greeting: authService.getTimeBasedGreeting(),
  
  login: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const { user: authUser, session } = await authService.signIn({ email, password });
      
      if (authUser && session) {
        const profile = await authService.getCurrentUserProfile();
        if (profile) {
          const user: User = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            profilePictureUrl: profile.profile_picture_url || undefined,
            age: profile.age || undefined,
            gender: profile.gender || undefined,
            occupation: profile.occupation || undefined,
            concerns: profile.mental_health_concerns,
            oauthProvider: profile.oauth_provider || undefined,
          };
          set({ user, isAuthenticated: true, loading: false });
        }
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ loading: true });
      await authService.signInWithGoogle();
      // OAuth callback will be handled by the auth state listener
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  loginWithFacebook: async () => {
    try {
      set({ loading: true });
      await authService.signInWithFacebook();
      // OAuth callback will be handled by the auth state listener
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  signup: async (userData: any) => {
    try {
      set({ loading: true });
      const signupData = {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        age: userData.age,
        gender: userData.gender,
        occupation: userData.occupation,
        mentalHealthConcerns: userData.concerns,
      };

      const { user: authUser, session } = await authService.signUp(signupData);
      
      if (authUser && session) {
        const profile = await authService.getCurrentUserProfile();
        if (profile) {
          const user: User = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            profilePictureUrl: profile.profile_picture_url || undefined,
            age: profile.age || undefined,
            gender: profile.gender || undefined,
            occupation: profile.occupation || undefined,
            concerns: profile.mental_health_concerns,
            oauthProvider: profile.oauth_provider || undefined,
          };
          set({ user, isAuthenticated: true, loading: false });
        }
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    try {
      const updatedProfile = await authService.updateProfile({
        full_name: updates.fullName,
        age: updates.age,
        gender: updates.gender,
        occupation: updates.occupation,
        mental_health_concerns: updates.concerns,
        profile_picture_url: updates.profilePictureUrl,
      });

      set(state => ({
        user: state.user ? { ...state.user, ...updates } : null
      }));
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  logout: () => {
    authService.signOut();
    set({ user: null, isAuthenticated: false, loading: false });
  },

  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          const profile = await authService.getCurrentUserProfile();
          if (profile) {
            const user: User = {
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name,
              profilePictureUrl: profile.profile_picture_url || undefined,
              age: profile.age || undefined,
              gender: profile.gender || undefined,
              occupation: profile.occupation || undefined,
              concerns: profile.mental_health_concerns,
              oauthProvider: profile.oauth_provider || undefined,
            };
            set({ user, isAuthenticated: true, loading: false });
          } else {
            set({ loading: false });
          }
        } catch (profileError) {
          console.error('Profile fetch error:', profileError);
          set({ loading: false });
        }
      } else {
        set({ loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            const profile = await authService.getCurrentUserProfile();
            if (profile) {
              const user: User = {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                profilePictureUrl: profile.profile_picture_url || undefined,
                age: profile.age || undefined,
                gender: profile.gender || undefined,
                occupation: profile.occupation || undefined,
                concerns: profile.mental_health_concerns,
                oauthProvider: profile.oauth_provider || undefined,
              };
              set({ user, isAuthenticated: true, loading: false });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isAuthenticated: false, loading: false });
          }
        } catch (authError) {
          console.error('Auth state change error:', authError);
          set({ loading: false });
        }
      });
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ loading: false });
    }
  },
}));