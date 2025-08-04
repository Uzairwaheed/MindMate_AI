import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Clock, Moon, Star, Save } from 'lucide-react-native';
import { sleepService } from '@/services/sleepService';

export default function LogSleepScreen() {
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepQuality, setSleepQuality] = useState(3);
  const [moodAfterSleep, setMoodAfterSleep] = useState('Good');
  const [notes, setNotes] = useState('');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [loading, setLoading] = useState(false);

  const moodOptions = ['Terrible', 'Poor', 'Fair', 'Good', 'Great', 'Amazing'];

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

  const handleTimeChange = (value: string, setter: (value: string) => void) => {
    // Ensure proper time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(value) || value === '') {
      setter(value);
    }
  };

  const handleSaveSleep = async () => {
    if (!bedtime || !wakeTime) {
      Alert.alert('Error', 'Please enter both bedtime and wake-up time');
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
        'Sleep Logged',
        'Your sleep entry has been saved successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save sleep entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setSleepQuality(star)}
            style={styles.starButton}
          >
            <Star
              size={32}
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
            <Moon size={24} color="#8B5CF6" />
            <Text style={styles.durationText}>Sleep Duration: {calculateDuration()}</Text>
          </View>

          {/* Time Inputs */}
          <View style={styles.timeSection}>
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
                />
              </View>
            </View>
          </View>

          {/* Sleep Quality */}
          <View style={styles.qualitySection}>
            <Text style={styles.sectionTitle}>Sleep Quality</Text>
            <Text style={styles.sectionSubtitle}>How well did you sleep?</Text>
            {renderStars()}
            <Text style={styles.qualityText}>
              {sleepQuality === 1 && 'Poor'}
              {sleepQuality === 2 && 'Fair'}
              {sleepQuality === 3 && 'Good'}
              {sleepQuality === 4 && 'Very Good'}
              {sleepQuality === 5 && 'Excellent'}
            </Text>
          </View>

          {/* Mood After Sleep */}
          <View style={styles.moodSection}>
            <Text style={styles.sectionTitle}>Mood After Sleep</Text>
            <Text style={styles.sectionSubtitle}>How do you feel upon waking?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodOptions}>
              {moodOptions.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodOption,
                    moodAfterSleep === mood && styles.moodOptionSelected
                  ]}
                  onPress={() => setMoodAfterSleep(mood)}
                >
                  <Text style={[
                    styles.moodOptionText,
                    moodAfterSleep === mood && styles.moodOptionTextSelected
                  ]}>
                    {mood}
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
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Daily Reminder Toggle */}
          <View style={styles.reminderSection}>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>Daily Sleep Reminder</Text>
              <Text style={styles.reminderSubtitle}>Get reminded to log your sleep</Text>
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
              {loading ? 'Saving...' : 'Save Sleep Entry'}
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
    marginBottom: 40,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  durationText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginLeft: 12,
  },
  timeSection: {
    marginBottom: 24,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeInputContent: {
    flex: 1,
    marginLeft: 12,
  },
  timeLabel: {
    fontSize: 14,
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
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  qualityText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  moodSection: {
    marginBottom: 24,
  },
  moodOptions: {
    flexDirection: 'row',
  },
  moodOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  moodOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  moodOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
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
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
});