import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { useSignupStore } from '@/store/signupStore';

const ageOptions = Array.from({ length: 83 }, (_, i) => i + 18);
const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
const occupationOptions = [
  'Student',
  'Freelancer',
  'Employee',
  'Entrepreneur',
  'Healthcare Worker',
  'Teacher',
  'Engineer',
  'Artist',
  'Retired',
  'Other'
];

export default function SignupStep2Screen() {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showOccupationDropdown, setShowOccupationDropdown] = useState(false);
  const { setStep2Data } = useSignupStore();

  const handleNext = () => {
    if (!age || !gender || !occupation) {
      alert('Please fill in all fields');
      return;
    }

    setStep2Data({ age: parseInt(age), gender, occupation });
    router.push('/auth/signup-step3');
  };

  const DropdownButton = ({ 
    value, 
    placeholder, 
    onPress, 
    options, 
    onSelect, 
    showDropdown 
  }: {
    value: string;
    placeholder: string;
    onPress: () => void;
    options: (string | number)[];
    onSelect: (value: string) => void;
    showDropdown: boolean;
  }) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.dropdown} onPress={onPress}>
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#6B7280" />
      </TouchableOpacity>
      {showDropdown && (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.scrollView} nestedScrollEnabled>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownOption}
                onPress={() => {
                  onSelect(option.toString());
                  onPress();
                }}
              >
                <Text style={styles.dropdownOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={['#E6F3FF', '#F3E8FF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Info</Text>
          <Text style={styles.subtitle}>Step 2 of 3</Text>
          <Text style={styles.description}>Help us personalize your experience</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Age</Text>
          <DropdownButton
            value={age}
            placeholder="Select your age"
            onPress={() => setShowAgeDropdown(!showAgeDropdown)}
            options={ageOptions}
            onSelect={setAge}
            showDropdown={showAgeDropdown}
          />

          <Text style={styles.label}>Gender</Text>
          <DropdownButton
            value={gender}
            placeholder="Select your gender"
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
            options={genderOptions}
            onSelect={setGender}
            showDropdown={showGenderDropdown}
          />

          <Text style={styles.label}>Occupation</Text>
          <DropdownButton
            value={occupation}
            placeholder="Select your occupation"
            onPress={() => setShowOccupationDropdown(!showOccupationDropdown)}
            options={occupationOptions}
            onSelect={setOccupation}
            showDropdown={showOccupationDropdown}
          />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 16,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  scrollView: {
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});