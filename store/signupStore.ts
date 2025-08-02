import { create } from 'zustand';

interface SignupData {
  step1?: {
    fullName: string;
    email: string;
    password: string;
  };
  step2?: {
    age: number;
    gender: string;
    occupation: string;
  };
  step3?: {
    concerns: string[];
    consentAccepted: boolean;
  };
}

interface SignupStore {
  data: SignupData;
  step1Data: SignupData['step1'];
  step2Data: SignupData['step2'];
  step3Data: SignupData['step3'];
  setStep1Data: (data: SignupData['step1']) => void;
  setStep2Data: (data: SignupData['step2']) => void;
  setStep3Data: (data: SignupData['step3']) => void;
  clearData: () => void;
}

export const useSignupStore = create<SignupStore>((set, get) => ({
  data: {},
  step1Data: undefined,
  step2Data: undefined,
  step3Data: undefined,
  
  setStep1Data: (data) => {
    set((state) => ({
      step1Data: data,
      data: { ...state.data, step1: data }
    }));
  },
  
  setStep2Data: (data) => {
    set((state) => ({
      step2Data: data,
      data: { ...state.data, step2: data }
    }));
  },
  
  setStep3Data: (data) => {
    set((state) => ({
      step3Data: data,
      data: { ...state.data, step3: data }
    }));
  },
  
  clearData: () => {
    set({
      data: {},
      step1Data: undefined,
      step2Data: undefined,
      step3Data: undefined,
    });
  },
}));