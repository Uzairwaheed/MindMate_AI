import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useSignupStore } from '@/store/signupStore';
import { useAuthStore } from '@/store/authStore';

const mentalHealthConcerns = [
  'Stress',
  'Anxiety',
  'Depression',
  'Self-awareness',
  'Sleep Issues',
  'Relationship Problems',
  'Work-Life Balance',
  'Just exploring'
];

export default function SignupStep3Screen() {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { step1Data, step2Data, setStep3Data } = useSignupStore();
  const { signup } = useAuthStore();

  const toggleConcern = (concern: string) => {
    setSelectedConcerns(prev => 
      prev.includes(concern)
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    );
  };

  const handleCreateAccount = async () => {
    if (selectedConcerns.length === 0) {
      alert('Please select at least one area of interest');
      return;
    }

    if (!consentAccepted) {
      alert('Please accept the consent agreement');
      return;
    }

    setLoading(true);
    try {
      setStep3Data({ concerns: selectedConcerns, consentAccepted });
      
      // Create the complete user profile
      const userData = {
        ...step1Data,
        ...step2Data,
        concerns: selectedConcerns,
        consentAccepted
      };

      await signup(userData);
      router.replace('/(tabs)');
    } catch (error) {
      alert('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#E6F3FF', '#F3E8FF']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color="#8B5CF6" />
            </TouchableOpacity>
            <Text style={styles.title}>Mental Wellness</Text>
            <Text style={styles.subtitle}>Step 3 of 3</Text>
            <Text style={styles.description}>
              What areas would you like support with? (Select all that apply)
            </Text>
          </View>

          <View style={styles.concernsContainer}>
            {mentalHealthConcerns.map((concern) => (
              <TouchableOpacity
                key={concern}
                style={[
                  styles.concernButton,
                  selectedConcerns.includes(concern) && styles.concernButtonSelected
                ]}
                onPress={() => toggleConcern(concern)}
              >
                <Text style={[
                  styles.concernText,
                  selectedConcerns.includes(concern) && styles.concernTextSelected
                ]}>
                  {concern}
                </Text>
                {selectedConcerns.includes(concern) && (
                  <Check size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.consentContainer}
            onPress={() => setConsentAccepted(!consentAccepted)}
          >
            <View style={[styles.checkbox, consentAccepted && styles.checkboxSelected]}>
              {consentAccepted && <Check size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.consentText}>
              I understand that this app does not replace professional medical advice, 
              diagnosis, or treatment. In case of emergency, please contact emergency 
              services or a mental health professional.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  concernsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  concernButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  concernButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  concernText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginRight: 8,
  },
  concernTextSelected: {
    color: '#FFFFFF',
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});