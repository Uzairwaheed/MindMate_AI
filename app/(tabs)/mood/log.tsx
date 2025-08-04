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
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const activities = [
    'Exercise', 'Meditation', 'Social time', 'Work',
    'Sleep well', 'Outdoor time', 'Creative activity', 'Reading',
    'Music', 'Therapy'
  ];

  const moodOptions = [
    { emoji: '😢', label: 'Very Sad', value: 1 },
    { emoji: '😟', label: 'Sad', value: 2 },
    { emoji: '😕', label: 'Down', value: 3 },
    { emoji: '😐', label: 'Neutral', value: 4 },
    { emoji: '🙂', label: 'Okay', value: 5 },
    { emoji: '😊', label: 'Good', value: 6 },
    { emoji: '😄', label: 'Happy', value: 7 },
    { emoji: '😁', label: 'Very Happy', value: 8 },
    { emoji: '🤩', label: 'Excited', value: 9 },
    { emoji: '😍', label: 'Excellent', value: 10 },
  ];

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSaveEntry = async () => {
    setLoading(true);
    try {
      await moodService.createMoodEntry({
        moodScore: mood,
        energyLevel: energy,
        anxietyLevel: anxiety,
        stressLevel: stress,
        sleepQuality: sleep,
        emotions: selectedActivities,
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

  const createSliderPanResponder = (value: number, setValue: (value: number) => void) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX } = evt.nativeEvent;
        const sliderWidth = 280; // Approximate slider width
        const newValue = Math.max(1, Math.min(10, Math.round((locationX / sliderWidth) * 10)));
        setValue(newValue);
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const sliderWidth = 280;
        const newValue = Math.max(1, Math.min(10, Math.round((locationX / sliderWidth) * 10)));
        setValue(newValue);
      },
    });
  };

  const renderSlider = (
    label: string,
    value: number,
    setValue: (value: number) => void,
    emoji: string,
    lowLabel: string,
    highLabel: string
  ) => {
    const panResponder = createSliderPanResponder(value, setValue);
    
    return (
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label} {emoji}</Text>
        </View>
        <View style={styles.sliderContainer} {...panResponder.panHandlers}>
          <View style={styles.slider}>
            <View 
              style={[
                styles.sliderTrack,
                { width: `${(value / 10) * 100}%` }
              ]} 
            />
            <View
              style={[
                styles.sliderThumb,
                { left: `${(value / 10) * 100 - 2}%` }
              ]}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>😢 {lowLabel}</Text>
            <Text style={styles.sliderValue}>{value}/10</Text>
            <Text style={styles.sliderLabelText}>😊 {highLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSection}>
      <Text style={styles.moodLabel}>Mood 😊</Text>
      <View style={styles.moodGrid}>
        {moodOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.moodOption,
              mood === option.value && styles.moodOptionSelected
            ]}
            onPress={() => setMood(option.value)}
          >
            <Text style={styles.moodEmoji}>{option.emoji}</Text>
            <Text style={[
              styles.moodOptionLabel,
              mood === option.value && styles.moodOptionLabelSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.moodSliderContainer}>
        <View style={styles.moodSlider} {...createSliderPanResponder(mood, setMood).panHandlers}>
          <View 
            style={[
              styles.moodSliderTrack,
              { width: `${(mood / 10) * 100}%` }
            ]} 
          />
          <View
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
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Log Your Mood</Text>
          <Text style={styles.subtitle}>How are you feeling right now?</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.moodCard}>
          {renderMoodSelector()}
          {renderSlider('Energy Level', energy, setEnergy, '⚡', 'Exhausted', 'Energetic')}
          {renderSlider('Anxiety Level', anxiety, setAnxiety, '😰', 'Calm', 'Very Anxious')}
          {renderSlider('Stress Level', stress, setStress, '😤', 'Relaxed', 'Very Stressed')}
          {renderSlider('Sleep Quality', sleep, setSleep, '😴', 'Poor', 'Excellent')}
        </View>

        <View style={styles.activitiesSection}>
          <Text style={styles.activitiesTitle}>Activities Today</Text>
          <View style={styles.activitiesGrid}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity}
                style={[
                  styles.activityButton,
                  selectedActivities.includes(activity) && styles.activityButtonSelected
                ]}
                onPress={() => toggleActivity(activity)}
              >
                <Text style={[
                  styles.activityText,
                  selectedActivities.includes(activity) && styles.activityTextSelected
                ]}>
                  {activity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  moodOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  moodOptionSelected: {
    backgroundColor: '#8B5CF615',
    borderColor: '#8B5CF6',
  },
  moodEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  moodOptionLabelSelected: {
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
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
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
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
  },
  sliderTrack: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  sliderThumb: {
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
  sliderValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
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
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityButtonSelected: {
    backgroundColor: '#8B5CF615',
    borderColor: '#8B5CF6',
  },
  activityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  activityTextSelected: {
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
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