import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, PanResponder } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { moodService } from '@/services/moodService';

export default function MoodLogScreen() {
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [anxiety, setAnxiety] = useState(3);
  const [stress, setStress] = useState(4);
  const [sleep, setSleep] = useState(7);
  const [dailyActivities, setDailyActivities] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const moodOptions = [
    { emoji: '😢', label: 'Very Low', value: 1 },
    { emoji: '😟', label: 'Low', value: 2 },
    { emoji: '😕', label: 'Poor', value: 3 },
    { emoji: '😐', label: 'Fair', value: 4 },
    { emoji: '🙂', label: 'Okay', value: 5 },
    { emoji: '😊', label: 'Good', value: 6 },
    { emoji: '😄', label: 'Great', value: 7 },
    { emoji: '😁', label: 'Very Good', value: 8 },
    { emoji: '🤩', label: 'Amazing', value: 9 },
    { emoji: '😍', label: 'Excellent', value: 10 },
  ];

  const handleSaveEntry = async () => {
    setLoading(true);
    try {
      await moodService.createMoodEntry({
        moodScore: mood,
        energyLevel: energy,
        anxietyLevel: anxiety,
        stressLevel: stress,
        sleepQuality: sleep,
        dailyActivities: dailyActivities,
        notes: notes.trim(),
      });

      Alert.alert(
        'Mood Logged',
        'Your mood entry has been saved successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save mood entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (
    label: string,
    value: number,
    setValue: (value: number) => void,
    emoji: string,
    lowLabel: string,
    highLabel: string,
    color: string = '#8B5CF6'
  ) => {
    
    return (
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label} {emoji}</Text>
          <Text style={[styles.sliderValue, { color }]}>{value}/10</Text>
        </View>
        <View style={styles.sliderContainer}>
          <View style={styles.slider}>
            <View style={[styles.sliderTrack, { backgroundColor: color, width: `${(value / 10) * 100}%` }]} />
            <TouchableOpacity 
              style={[styles.sliderThumb, { backgroundColor: color, left: `${(value / 10) * 100 - 2}%` }]}
              onPressIn={(e) => {
                const { locationX } = e.nativeEvent;
                const newValue = Math.round((locationX / 280) * 10); // Full width slider
                setValue(Math.max(1, Math.min(10, newValue)));
              }}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>😢 {lowLabel}</Text>
            <Text style={styles.sliderLabelText}>😊 {highLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Log Your Mood</Text>
          <Text style={styles.subtitle}>How are you feeling right now?</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.moodCard}>
          {/* Mood Selector */}
          <View style={styles.moodSection}>
            <Text style={styles.moodLabel}>Mood 😊</Text>
            <View style={styles.moodSliderContainer}>
              <View style={styles.moodSlider}>
                <View 
                  style={[
                    styles.moodSliderTrack,
                    { width: `${(mood / 10) * 100}%` }
                  ]} 
                />
                <TouchableOpacity
                  onPressIn={(e) => {
                    const { locationX } = e.nativeEvent;
                    const newValue = Math.round((locationX / 280) * 10);
                    setMood(Math.max(1, Math.min(10, newValue)));
                  }}
                  style={[
                    styles.moodSliderThumb,
                    { left: `${(mood / 10) * 100 - 2}%` }
                  ]}
                />
              </View>
              <View style={styles.moodSliderLabels}>
                <Text style={styles.moodSliderLabel}>😢 Very Low</Text>
                <Text style={styles.moodSliderValue}>{mood}/10</Text>
                <Text style={styles.moodSliderLabel}>😊 Excellent</Text>
              </View>
            </View>
          </View>

          {/* Other Sliders */}
          {renderSlider('Energy Level', energy, setEnergy, '⚡', 'Exhausted', 'Energetic', '#10B981')}
          {renderSlider('Anxiety Level', anxiety, setAnxiety, '😰', 'Calm', 'Very Anxious', '#F59E0B')}
          {renderSlider('Stress Level', stress, setStress, '😤', 'Relaxed', 'Very Stressed', '#EF4444')}
          {renderSlider('Sleep Quality', sleep, setSleep, '😴', 'Poor', 'Excellent', '#6366F1')}
        </View>

        <View style={styles.activitiesSection}>
          <Text style={styles.activitiesTitle}>Daily Activities</Text>
          <TextInput
            style={styles.activitiesInput}
            value={dailyActivities}
            onChangeText={setDailyActivities}
            placeholder="What did you do today? (e.g., Exercise, Work, Social time...)"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How was your day? Any thoughts or feelings you'd like to record..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveEntry}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Entry'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F3FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  moodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  moodSection: {
    marginBottom: 24,
  },
  moodLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 16,
  },
  moodSliderContainer: {
    paddingHorizontal: 4,
  },
  moodSlider: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 12,
  },
  moodSliderTrack: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  moodSliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#8B5CF6',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodSliderLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  moodSliderValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  sliderValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  slider: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 12,
    width: '100%', // Full width slider
  },
  sliderTrack: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabelText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  activitiesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activitiesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  activitiesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 80,
    textAlignVertical: 'top',
  },
  notesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  notesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});