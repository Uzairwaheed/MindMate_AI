import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  age?: number;
  gender?: string;
  occupation?: string;
  concerns?: string[];
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: '1',
      email,
      fullName: 'John Doe',
    };
    
    set({ user, isAuthenticated: true });
  },
  
  signup: async (userData: any) => {
    // Simulate signup
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const user: User = {
      id: Date.now().toString(),
      email: userData.email,
      fullName: userData.fullName,
      age: userData.age,
      gender: userData.gender,
      occupation: userData.occupation,
      concerns: userData.concerns,
    };
    
    set({ user, isAuthenticated: true });
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));