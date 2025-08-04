import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, TrendingUp, Clock, Star, Calendar } from 'lucide-react-native';
import { sleepService, SleepEntry, SleepAnalytics } from '@/services/sleepService';

export default function SleepTrendsScreen() {
  const [analytics, setAnalytics] = useState<SleepAnalytics>({
    weeklyAverage: 0,
    qualityAverage: 0,
    consistency: 0,
    totalEntries: 0,
    insights: [],
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [viewPeriod, setViewPeriod] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSleepTrends();
  }, [viewPeriod]);

  const loadSleepTrends = async () => {
    try {
      const [analyticsData, chartData] = await Promise.all([
        sleepService.getSleepAnalytics(viewPeriod),
        sleepService.getChartData(viewPeriod)
      ]);
      
      setAnalytics(analyticsData);
      setChartData(chartData);
    } catch (error) {
      console.error('Failed to load sleep trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const renderDurationChart = () => {
    const maxDuration = Math.max(...chartData.map(d => d.duration || 0), 10);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sleep Duration Trend</Text>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[Math.round(maxDuration), Math.round(maxDuration * 0.75), Math.round(maxDuration * 0.5), Math.round(maxDuration * 0.25)].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value}h</Text>
            ))}
          </View>
          
          {/* Chart bars */}
          <View style={styles.chartBars}>
            {chartData.map((point, index) => {
              const height = point.duration ? (point.duration / maxDuration) * 100 : 0;
              return (
                <View key={index} style={styles.chartBarContainer}>
                  <View style={styles.chartBarBackground}>
                    <View 
                      style={[
                        styles.chartBar,
                        { 
                          height: `${height}%`,
                          backgroundColor: point.duration 
                            ? (point.duration >= 7 ? '#10B981' : point.duration >= 6 ? '#F59E0B' : '#EF4444')
                            : '#374151'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.chartBarLabel}>
                    {point.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderQualityChart = () => {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sleep Quality Trend</Text>
        <View style={styles.qualityChartArea}>
          {chartData.map((point, index) => {
            const quality = point.quality || 0;
            return (
              <View key={index} style={styles.qualityPoint}>
                <View style={styles.qualityStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={12}
                      color={star <= quality ? '#F59E0B' : '#6B7280'}
                      fill={star <= quality ? '#F59E0B' : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.qualityDate}>
                  {point.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderConsistencyChart = () => {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sleep Schedule Consistency</Text>
        <View style={styles.consistencyArea}>
          {chartData.map((point, index) => (
            <View key={index} style={styles.consistencyDay}>
              <Text style={styles.consistencyTime}>
                {point.bedtime || '--:--'}
              </Text>
              <View style={styles.consistencyBar}>
                <View style={[
                  styles.consistencyBlock,
                  { backgroundColor: point.bedtime ? '#8B5CF6' : '#374151' }
                ]} />
              </View>
              <Text style={styles.consistencyTime}>
                {point.wakeTime || '--:--'}
              </Text>
              <Text style={styles.consistencyDate}>
                {point.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
            </View>
          ))}
        </View>
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
        <Text style={styles.title}>Sleep Trends</Text>
        <Text style={styles.subtitle}>Analyze your sleep patterns</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, viewPeriod === 7 && styles.periodButtonActive]}
            onPress={() => setViewPeriod(7)}
          >
            <Text style={[styles.periodButtonText, viewPeriod === 7 && styles.periodButtonTextActive]}>
              7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, viewPeriod === 30 && styles.periodButtonActive]}
            onPress={() => setViewPeriod(30)}
          >
            <Text style={[styles.periodButtonText, viewPeriod === 30 && styles.periodButtonTextActive]}>
              30 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Clock size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>
              {loading ? '...' : formatDuration(analytics.weeklyAverage)}
            </Text>
            <Text style={styles.statLabel}>Average Sleep</Text>
          </View>
          
          <View style={styles.statCard}>
            <Star size={24} color="#F59E0B" />
            <Text style={styles.statValue}>
              {loading ? '...' : `${analytics.qualityAverage}/5`}
            </Text>
            <Text style={styles.statLabel}>Avg Quality</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.statValue}>
              {loading ? '...' : `${analytics.consistency}%`}
            </Text>
            <Text style={styles.statLabel}>Consistency</Text>
          </View>
        </View>

        {/* Charts */}
        {renderDurationChart()}
        {renderQualityChart()}
        {renderConsistencyChart()}

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Sleep Insights</Text>
          {analytics.insights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>• {insight}</Text>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>Recommendations</Text>
          <Text style={styles.recommendationText}>
            • Aim for 7-9 hours of sleep per night
          </Text>
          <Text style={styles.recommendationText}>
            • Keep a consistent bedtime and wake time
          </Text>
          <Text style={styles.recommendationText}>
            • Create a relaxing bedtime routine
          </Text>
          <Text style={styles.recommendationText}>
            • Avoid screens 1 hour before bed
          </Text>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    height: 120,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarBackground: {
    height: 100,
    width: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  qualityChartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  qualityPoint: {
    alignItems: 'center',
    flex: 1,
  },
  qualityStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  qualityDate: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  consistencyArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  consistencyDay: {
    alignItems: 'center',
    flex: 1,
  },
  consistencyTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  consistencyBar: {
    height: 40,
    width: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  consistencyBlock: {
    width: 8,
    height: 20,
    borderRadius: 4,
  },
  consistencyDate: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  insightsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 6,
  },
  recommendationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 4,
  },
});