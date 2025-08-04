import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Moon, Clock, TrendingUp, Plus, ChartBar as BarChart3, Star } from 'lucide-react-native';
import { sleepService, SleepAnalytics } from '@/services/sleepService';
import { Database } from '@/types/database';

type SleepEntry = Database['public']['Tables']['sleep_entries']['Row'];

export default function SleepScreen() {
  const [recentEntry, setRecentEntry] = useState<SleepEntry | null>(null);
  const [analytics, setAnalytics] = useState<SleepAnalytics>({
    weeklyAverage: 0,
    qualityAverage: 0,
    consistency: 0,
    totalEntries: 0,
    insights: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSleepData();
  }, []);

  const loadSleepData = async () => {
    try {
      const [entries, analyticsData] = await Promise.all([
        sleepService.getUserSleepEntries(1),
        sleepService.getSleepAnalytics(7)
      ]);
      
      setRecentEntry(entries[0] || null);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load sleep data:', error);
      Alert.alert('Error', 'Failed to load sleep data');
    } finally {
      setLoading(false);
    }
  };

  const renderQualityStars = (quality: number) => {
    return (
      <View style={styles.qualityStars}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            size={12}
            color={star <= quality ? '#F59E0B' : '#6B7280'}
            fill={star <= quality ? '#F59E0B' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#374151', '#4B5563']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Moon size={32} color="#E5E7EB" />
          <Text style={styles.title}>Sleep Tracker</Text>
          <Text style={styles.subtitle}>Monitor your sleep patterns for better mental health</Text>
        </View>

        {/* Recent Sleep Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {recentEntry ? 'Last Night\'s Sleep' : 'No Recent Sleep Data'}
          </Text>
          {recentEntry ? (
            <>
              <Text style={styles.sleepDuration}>
                {sleepService.formatDuration(recentEntry.sleep_duration)}
              </Text>
              <Text style={[
                styles.sleepQuality,
                { color: sleepService.getQualityColor(recentEntry.sleep_quality) }
              ]}>
                Quality: {sleepService.getQualityText(recentEntry.sleep_quality)} ({recentEntry.sleep_quality}/10)
              </Text>
              
              {renderQualityStars(recentEntry.sleep_quality)}
              
              <View style={styles.timeContainer}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Bedtime</Text>
                  <Text style={styles.timeValue}>{recentEntry.bedtime}</Text>
                </View>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Wake Time</Text>
                  <Text style={styles.timeValue}>{recentEntry.wake_time}</Text>
                </View>
              </View>

              <View style={styles.moodContainer}>
                <Text style={styles.moodLabel}>Mood After Sleep:</Text>
                <Text style={styles.moodValue}>{recentEntry.mood_after_sleep}</Text>
              </View>

              {recentEntry.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>"{recentEntry.notes}"</Text>
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity 
              style={styles.firstLogButton}
              onPress={() => router.push('/sleep/log')}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.firstLogButtonText}>Log Your First Sleep</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Sleep Statistics (7 Days)</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Clock size={20} color="#8B5CF6" />
              <Text style={styles.statValue}>
                {loading ? '...' : sleepService.formatDuration(analytics.weeklyAverage)}
              </Text>
              <Text style={styles.statLabel}>Average Duration</Text>
            </View>
            
            <View style={styles.statItem}>
              <Star size={20} color="#F59E0B" />
              <Text style={styles.statValue}>
                {loading ? '...' : `${analytics.qualityAverage}/10`}
              </Text>
              <Text style={styles.statLabel}>Average Quality</Text>
            </View>
            
            <View style={styles.statItem}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.statValue}>
                {loading ? '...' : `${analytics.consistency}%`}
              </Text>
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
          </View>
        </View>

        {/* Mood Correlation */}
        {analytics.moodCorrelation && (
          <View style={styles.correlationCard}>
            <Text style={styles.cardTitle}>💡 Sleep & Mood Connection</Text>
            <View style={styles.correlationStats}>
              <View style={styles.correlationStat}>
                <Text style={styles.correlationLabel}>7+ Hours Sleep</Text>
                <Text style={[styles.correlationValue, { color: '#10B981' }]}>
                  {analytics.moodCorrelation.averageMoodWith7Plus}/10 mood
                </Text>
              </View>
              <View style={styles.correlationStat}>
                <Text style={styles.correlationLabel}>{"< 7 Hours Sleep"}</Text>
                <Text style={[styles.correlationValue, { color: '#EF4444' }]}>
                  {analytics.moodCorrelation.averageMoodWithLess7}/10 mood
                </Text>
              </View>
            </View>
            <Text style={styles.correlationInsight}>
              {analytics.moodCorrelation.correlation === 'positive' && 
                '✅ Your mood improves with better sleep!'}
              {analytics.moodCorrelation.correlation === 'negative' && 
                '⚠️ Sleep duration doesn\'t seem to affect your mood'}
              {analytics.moodCorrelation.correlation === 'neutral' && 
                '➡️ Need more data to see sleep-mood patterns'}
            </Text>
          </View>
        )}

        {/* Key Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>📊 Key Insights</Text>
          {analytics.insights.length > 0 ? (
            analytics.insights.slice(0, 3).map((insight, index) => (
              <Text key={index} style={styles.insightText}>• {insight}</Text>
            ))
          ) : (
            <Text style={styles.noInsightsText}>
              Log more sleep entries to see personalized insights!
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/sleep/log')}
          >
            <Plus size={24} color="#E5E7EB" />
            <Text style={styles.actionButtonText}>Log Sleep</Text>
            <Text style={styles.actionButtonSubtext}>Record last night</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/sleep/trends')}
          >
            <BarChart3 size={24} color="#E5E7EB" />
            <Text style={styles.actionButtonText}>View Trends</Text>
            <Text style={styles.actionButtonSubtext}>Detailed analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💤 Sleep Tips for Better Mental Health</Text>
          <Text style={styles.tipText}>• Quality sleep reduces anxiety and depression</Text>
          <Text style={styles.tipText}>• Consistent sleep schedule regulates mood</Text>
          <Text style={styles.tipText}>• 7-9 hours optimizes emotional regulation</Text>
          <Text style={styles.tipText}>• Poor sleep can worsen mental health symptoms</Text>
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
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    marginBottom: 12,
  },
  sleepDuration: {
    fontSize: 36,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  sleepQuality: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  qualityStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginRight: 8,
  },
  moodValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  notesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  firstLogButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  firstLogButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  correlationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  correlationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  correlationStat: {
    alignItems: 'center',
  },
  correlationLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
    textAlign: 'center',
  },
  correlationValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  correlationInsight: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    textAlign: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 6,
  },
  noInsightsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginTop: 8,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
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