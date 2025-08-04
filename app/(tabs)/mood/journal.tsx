import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Calendar, Save, BookOpen } from 'lucide-react-native';
import { journalService } from '@/services/journalService';

export default function JournalScreen() {
  const [journalEntry, setJournalEntry] = useState('');
  const [moodRating, setMoodRating] = useState<number>(5);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      const entries = await journalService.getUserEntries(5);
      setRecentEntries(entries);
    } catch (error) {
      console.error('Failed to load recent entries:', error);
    }
  };

  const handleSaveEntry = async () => {
    if (!journalEntry.trim()) {
      Alert.alert('Empty Entry', 'Please write something in your journal entry.');
      return;
    }

    setLoading(true);
    try {
      await journalService.createEntry({
        content: journalEntry.trim(),
        moodRating: moodRating,
        entryDate: selectedDate.toISOString().split('T')[0],
      });

      Alert.alert(
        'Entry Saved',
        'Your journal entry has been saved successfully!',
        [{ text: 'OK', onPress: () => {
          setJournalEntry('');
          loadRecentEntries();
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return '😢';
    if (rating <= 4) return '😟';
    if (rating <= 6) return '😐';
    if (rating <= 8) return '🙂';
    return '😊';
  };

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
          <Text style={styles.title}>Daily Journal</Text>
          <Text style={styles.subtitle}>Express your thoughts and feelings</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.journalCard}>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Date</Text>
            <View style={styles.dateContainer}>
              <Calendar size={16} color="#8B5CF6" />
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString('en-US', { 
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.moodSection}>
            <Text style={styles.moodLabel}>Mood Today</Text>
            <View style={styles.moodContainer}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(moodRating)}</Text>
              <View style={styles.sliderContainer}>
                <View style={styles.slider}>
                  <View 
                    style={[
                      styles.sliderTrack,
                      { width: `${(moodRating / 10) * 100}%` }
                    ]} 
                  />
                  <TouchableOpacity
                    style={[
                      styles.sliderThumb,
                      { left: `${(moodRating / 10) * 100 - 2}%` }
                    ]}
                    onPressIn={(e) => {
                      // Simple slider implementation
                    }}
                  />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>😢 Very Low</Text>
                  <Text style={styles.sliderValue}>{moodRating}/10</Text>
                  <Text style={styles.sliderLabel}>😊 Excellent</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.journalSection}>
            <Text style={styles.journalLabel}>What's on your mind?</Text>
            <TextInput
              style={styles.textArea}
              value={journalEntry}
              onChangeText={setJournalEntry}
              placeholder="Write about your day, your feelings, your thoughts... There's no wrong way to journal."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {journalEntry.length} characters • Your entries are private and secure
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSaveEntry}
            disabled={loading}
          >
            <Save size={20} color="#FFFFFF" style={styles.saveIcon} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <BookOpen size={20} color="#6B7280" />
            <Text style={styles.recentTitle}>Recent Entries</Text>
          </View>
          
          {recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => (
              <View key={entry.id} style={styles.recentEntry}>
                <View style={styles.recentEntryHeader}>
                  <Text style={styles.recentEntryDate}>
                    {new Date(entry.entry_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </Text>
                  <Text style={styles.recentEntryMood}>
                    {getMoodEmoji(entry.mood_rating || 5)}
                  </Text>
                </View>
                <Text style={styles.recentEntryContent} numberOfLines={2}>
                  {entry.content}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent entries</Text>
            </View>
          )}
        </View>

        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipsIcon}>
              <Text style={styles.tipsIconText}>💡</Text>
            </View>
            <Text style={styles.tipsTitle}>Journaling Tips</Text>
          </View>
          <Text style={styles.tipText}>• Write freely without worrying about grammar or structure</Text>
          <Text style={styles.tipText}>• Focus on how events made you feel, not just what happened</Text>
          <Text style={styles.tipText}>• Try to write at the same time each day to build a habit</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
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
  journalCard: {
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
  dateSection: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 8,
  },
  moodSection: {
    marginBottom: 24,
  },
  moodLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 12,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  sliderContainer: {
    flex: 1,
  },
  slider: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
  },
  sliderTrack: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#3B82F6',
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
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  sliderValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  journalSection: {
    marginBottom: 24,
  },
  journalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
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
  recentSection: {
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
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
  },
  recentEntry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentEntryDate: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  recentEntryMood: {
    fontSize: 20,
  },
  recentEntryContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tipsIconText: {
    fontSize: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
});