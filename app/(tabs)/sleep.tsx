import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Moon, Clock, TrendingUp, Plus, ChartBar as BarChart3 } from 'lucide-react-native';
import { sleepService, SleepEntry, SleepAnalytics } from '@/services/sleepService';

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

  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getQualityText = (quality: number): string => {
    if (quality <= 1) return 'Poor';
    if (quality <= 2) return 'Fair';
    if (quality <= 3) return 'Good';
    if (quality <= 4) return 'Very Good';
    return 'Excellent';
  };

  const getQualityColor = (quality: number): string => {
    if (quality <= 2) return '#EF4444';
    if (quality <= 3) return '#F59E0B';
    return '#10B981';
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
          <Text style={styles.subtitle}>Monitor your sleep patterns</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {recentEntry ? 'Last Night' : 'No Recent Sleep Data'}
          </Text>
          {recentEntry ? (
            <>
              <Text style={styles.sleepDuration}>
                {formatDuration(recentEntry.sleep_duration)}
              </Text>
              <Text style={[
                styles.sleepQuality,
                { color: getQualityColor(recentEntry.sleep_quality) }
              ]}>
                Sleep Quality: {getQualityText(recentEntry.sleep_quality)}
              </Text>
              
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

        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Sleep Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? '...' : formatDuration(analytics.weeklyAverage)}
              </Text>
              <Text style={styles.statLabel}>Weekly Average</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? '...' : `${analytics.qualityAverage}/5`}
              </Text>
              <Text style={styles.statLabel}>Avg Quality</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? '...' : `${analytics.consistency}%`}
              </Text>
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
          </View>
        </View>

        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>Sleep Insights</Text>
          {analytics.insights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>• {insight}</Text>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/sleep/log')}
          >
            <Plus size={24} color="#E5E7EB" />
            <Text style={styles.actionButtonText}>Log Sleep</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/sleep/trends')}
          >
            <BarChart3 size={24} color="#E5E7EB" />
            <Text style={styles.actionButtonText}>View Trends</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Sleep Tips</Text>
          <Text style={styles.tipText}>• Maintain a consistent sleep schedule</Text>
          <Text style={styles.tipText}>• Create a relaxing bedtime routine</Text>
          <Text style={styles.tipText}>• Avoid screens 1 hour before bed</Text>
          <Text style={styles.tipText}>• Keep your bedroom cool and dark</Text>
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
    marginBottom: 8,
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
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 32,
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    textAlign: 'center',
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#E5E7EB',
    marginTop: 8,
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