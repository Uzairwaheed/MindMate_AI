import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Clock, Moon, Star, Save } from 'lucide-react-native';
import { sleepService } from '@/services/sleepService';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function LogSleepScreen() {
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepQuality, setSleepQuality] = useState(7);
  const [moodAfterSleep, setMoodAfterSleep] = useState('Good');
  const [notes, setNotes] = useState('');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [loading, setLoading] = useState(false);

  const qualitySlider = useSharedValue(sleepQuality);

  const moodOptions = [
    { label: 'Terrible', emoji: '😫', value: 'Terrible' },
    { label: 'Poor', emoji: '😴', value: 'Poor' },
    { label: 'Fair', emoji: '😐', value: 'Fair' },
    { label: 'Good', emoji: '🙂', value: 'Good' },
    { label: 'Great', emoji: '😊', value: 'Great' },
    { label: 'Amazing', emoji: '🤩', value: 'Amazing' },
  ];

  const calculateDuration = (): string => {
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    let bedTimeMinutes = bedHour * 60 + bedMin;
    let wakeTimeMinutes = wakeHour * 60 + wakeMin;
    
    if (wakeTimeMinutes < bedTimeMinutes) {
      wakeTimeMinutes += 24 * 60;
    }
    
    const durationMinutes = wakeTimeMinutes - bedTimeMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleTimeChange = (value: string, setter: (value: string) => void) => {
    // Allow partial input while typing
    if (value.length <= 5) {
      setter(value);
    }
  };

  const handleQualityChange = (value: number) => {
    setSleepQuality(value);
    qualitySlider.value = withSpring(value);
  };

  const handleSaveSleep = async () => {
    // Validation
    if (!validateTime(bedtime)) {
      Alert.alert('Invalid Time', 'Please enter a valid bedtime (HH:MM format)');
      return;
    }

    if (!validateTime(wakeTime)) {
      Alert.alert('Invalid Time', 'Please enter a valid wake-up time (HH:MM format)');
      return;
    }

    if (sleepQuality < 1 || sleepQuality > 10) {
      Alert.alert('Invalid Quality', 'Sleep quality must be between 1 and 10');
      return;
    }

    setLoading(true);
    try {
      await sleepService.createSleepEntry({
        bedtime,
        wakeTime,
        sleepQuality,
        moodAfterSleep,
        notes: notes.trim(),
      });

      Alert.alert(
        'Sleep Logged Successfully!',
        'Your sleep entry has been saved.',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Reset form
            setBedtime('22:30');
            setWakeTime('07:00');
            setSleepQuality(7);
            setMoodAfterSleep('Good');
            setNotes('');
            router.back();
          }
        }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save sleep entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderQualitySlider = () => {
    const animatedStyle = useAnimatedStyle(() => ({
      width: `${(qualitySlider.value / 10) * 100}%`,
    }));

    return (
      <View style={styles.qualitySliderContainer}>
        <View style={styles.qualitySlider}>
          <Animated.View style={[styles.qualitySliderFill, animatedStyle]} />
          <View style={styles.qualityMarkers}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.qualityMarker,
                  sleepQuality >= value && styles.qualityMarkerActive
                ]}
                onPress={() => handleQualityChange(value)}
              >
                <Text style={[
                  styles.qualityMarkerText,
                  sleepQuality >= value && styles.qualityMarkerTextActive
                ]}>
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleQualityChange(star)}
            style={styles.starButton}
          >
            <Star
              size={24}
              color={star <= sleepQuality ? '#F59E0B' : '#6B7280'}
              fill={star <= sleepQuality ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#374151', '#4B5563']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#E5E7EB" />
        </TouchableOpacity>
        <Text style={styles.title}>Log Sleep</Text>
        <Text style={styles.subtitle}>Record your sleep patterns</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Sleep Duration Display */}
          <View style={styles.durationSection}>
            <Moon size={28} color="#8B5CF6" />
            <View style={styles.durationContent}>
              <Text style={styles.durationLabel}>Total Sleep Duration</Text>
              <Text style={styles.durationText}>{calculateDuration()}</Text>
            </View>
          </View>

          {/* Time Inputs */}
          <View style={styles.timeSection}>
            <Text style={styles.sectionTitle}>Sleep Times</Text>
            
            <View style={styles.timeInputRow}>
              <View style={styles.timeInput}>
                <Clock size={20} color="#9CA3AF" />
                <View style={styles.timeInputContent}>
                  <Text style={styles.timeLabel}>Bedtime</Text>
                  <TextInput
                    style={styles.timeField}
                    value={bedtime}
                    onChangeText={(value) => handleTimeChange(value, setBedtime)}
                    placeholder="22:30"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={styles.timeInput}>
                <Clock size={20} color="#9CA3AF" />
                <View style={styles.timeInputContent}>
                  <Text style={styles.timeLabel}>Wake-up Time</Text>
                  <TextInput
                    style={styles.timeField}
                    value={wakeTime}
                    onChangeText={(value) => handleTimeChange(value, setWakeTime)}
                    placeholder="07:00"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Sleep Quality */}
          <View style={styles.qualitySection}>
            <Text style={styles.sectionTitle}>Sleep Quality</Text>
            <Text style={styles.sectionSubtitle}>Rate your sleep from 1-10</Text>
            
            <View style={styles.qualityDisplay}>
              <Text style={styles.qualityValue}>{sleepQuality}/10</Text>
              <Text style={styles.qualityDescription}>
                {sleepQuality <= 3 && 'Poor'}
                {sleepQuality > 3 && sleepQuality <= 6 && 'Fair'}
                {sleepQuality > 6 && sleepQuality <= 8 && 'Good'}
                {sleepQuality > 8 && 'Excellent'}
              </Text>
            </View>

            {renderStars()}
          </View>

          {/* Mood After Sleep */}
          <View style={styles.moodSection}>
            <Text style={styles.sectionTitle}>Mood After Sleep</Text>
            <Text style={styles.sectionSubtitle}>How do you feel upon waking?</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.moodOptions}
              contentContainerStyle={styles.moodOptionsContent}
            >
              {moodOptions.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodOption,
                    moodAfterSleep === mood.value && styles.moodOptionSelected
                  ]}
                  onPress={() => setMoodAfterSleep(mood.value)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodOptionText,
                    moodAfterSleep === mood.value && styles.moodOptionTextSelected
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any dreams, sleep disturbances, or observations..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{notes.length}/500 characters</Text>
          </View>

          {/* Daily Reminder Toggle */}
          <View style={styles.reminderSection}>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>Daily Sleep Reminder</Text>
              <Text style={styles.reminderSubtitle}>Get reminded to log your sleep at 9 PM</Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ false: '#374151', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveSleep}
            disabled={loading}
          >
            <Save size={20} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving Sleep Entry...' : 'Save Sleep Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Sleep Tips</Text>
          <Text style={styles.tipText}>• Aim for 7-9 hours of sleep per night</Text>
          <Text style={styles.tipText}>• Keep consistent bedtime and wake times</Text>
          <Text style={styles.tipText}>• Avoid screens 1 hour before bed</Text>
          <Text style={styles.tipText}>• Create a relaxing bedtime routine</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 60,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  durationContent: {
    marginLeft: 16,
  },
  durationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
  },
  timeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 16,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeInputContent: {
    flex: 1,
    marginLeft: 12,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  timeField: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    padding: 0,
  },
  qualitySection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  qualityDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qualityValue: {
    fontSize: 32,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  qualityDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
  },
  qualitySliderContainer: {
    width: '100%',
    marginBottom: 16,
  },
  qualitySlider: {
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
  },
  qualitySliderFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
  },
  qualityMarkers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  qualityMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityMarkerActive: {
    backgroundColor: '#FFFFFF',
  },
  qualityMarkerText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  qualityMarkerTextActive: {
    color: '#8B5CF6',
  },
  starsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  moodSection: {
    marginBottom: 24,
  },
  moodOptions: {
    flexDirection: 'row',
  },
  moodOptionsContent: {
    paddingHorizontal: 4,
  },
  moodOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    minWidth: 80,
  },
  moodOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  moodOptionTextSelected: {
    color: '#FFFFFF',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
    height: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'right',
  },
  reminderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#E5E7EB',
    marginBottom: 2,
  },
  reminderSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 4,
  },
});