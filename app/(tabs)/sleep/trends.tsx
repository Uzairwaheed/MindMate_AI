import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, TrendingUp, Clock, Star, Calendar, Heart } from 'lucide-react-native';
import { sleepService, SleepAnalytics, SleepChartData } from '@/services/sleepService';

export default function SleepTrendsScreen() {
  const [analytics, setAnalytics] = useState<SleepAnalytics>({
    weeklyAverage: 0,
    qualityAverage: 0,
    consistency: 0,
    totalEntries: 0,
    insights: [],
  });
  const [chartData, setChartData] = useState<SleepChartData[]>([]);
  const [viewPeriod, setViewPeriod] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSleepTrends();
  }, [viewPeriod]);

  const loadSleepTrends = async () => {
    try {
      const [analyticsData, chartDataResult] = await Promise.all([
        sleepService.getSleepAnalytics(viewPeriod),
        sleepService.getChartData(viewPeriod)
      ]);
      
      setAnalytics(analyticsData);
      setChartData(chartDataResult);
    } catch (error) {
      console.error('Failed to load sleep trends:', error);
    } finally {
      setLoading(false);
    }
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
              const color = point.duration 
                ? (point.duration >= 7 ? '#10B981' : point.duration >= 6 ? '#F59E0B' : '#EF4444')
                : '#374151';
              
              return (
                <View key={index} style={styles.chartBarContainer}>
                  <View style={styles.chartBarBackground}>
                    <View 
                      style={[
                        styles.chartBar,
                        { height: `${height}%`, backgroundColor: color }
                      ]} 
                    />
                  </View>
                  <Text style={styles.chartBarLabel}>
                    {point.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </Text>
                  {point.duration && (
                    <Text style={styles.chartBarValue}>
                      {sleepService.formatDuration(point.duration)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>7+ hours (Good)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>6-7 hours (Fair)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>{'< 6 hours (Poor)'}</Text>
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
            const color = sleepService.getQualityColor(quality);
            
            return (
              <View key={index} style={styles.qualityPoint}>
                <View style={styles.qualityBar}>
                  <View 
                    style={[
                      styles.qualityBarFill,
                      { 
                        height: `${(quality / 10) * 100}%`,
                        backgroundColor: color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.qualityValue}>{quality || 0}</Text>
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

  const renderMoodCorrelationChart = () => {
    if (!analytics.moodCorrelation) return null;

    const { averageMoodWith7Plus, averageMoodWithLess7, correlation } = analytics.moodCorrelation;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sleep vs Mood Correlation</Text>
        <View style={styles.correlationArea}>
          <View style={styles.correlationBar}>
            <Text style={styles.correlationLabel}>7+ Hours Sleep</Text>
            <View style={styles.correlationBarContainer}>
              <View 
                style={[
                  styles.correlationBarFill,
                  { 
                    width: `${(averageMoodWith7Plus / 10) * 100}%`,
                    backgroundColor: '#10B981'
                  }
                ]} 
              />
            </View>
            <Text style={styles.correlationValue}>{averageMoodWith7Plus}/10</Text>
          </View>
          
          <View style={styles.correlationBar}>
            <Text style={styles.correlationLabel}>< 7 Hours Sleep</Text>
            <View style={styles.correlationBarContainer}>
              <View 
                style={[
                  styles.correlationBarFill,
                  { 
                    width: `${(averageMoodWithLess7 / 10) * 100}%`,
                    backgroundColor: '#EF4444'
                  }
                ]} 
              />
            </View>
            <Text style={styles.correlationValue}>{averageMoodWithLess7}/10</Text>
          </View>
        </View>
        
        <Text style={styles.correlationInsight}>
          {correlation === 'positive' && '✅ Better sleep improves your mood'}
          {correlation === 'negative' && '⚠️ Sleep duration doesn\'t seem to affect your mood'}
          {correlation === 'neutral' && '➡️ No clear correlation between sleep and mood yet'}
        </Text>
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
        <View style={styles.consistencyScore}>
          <Text style={styles.consistencyScoreText}>
            Consistency Score: {analytics.consistency}%
          </Text>
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
              {loading ? '...' : sleepService.formatDuration(analytics.weeklyAverage)}
            </Text>
            <Text style={styles.statLabel}>Average Sleep</Text>
          </View>
          
          <View style={styles.statCard}>
            <Star size={24} color="#F59E0B" />
            <Text style={styles.statValue}>
              {loading ? '...' : `${analytics.qualityAverage}/10`}
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
        {renderMoodCorrelationChart()}
        {renderConsistencyChart()}

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>📊 Sleep Insights</Text>
          {analytics.insights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>• {insight}</Text>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>💡 Recommendations</Text>
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
          <Text style={styles.recommendationText}>
            • Keep your bedroom cool, dark, and quiet
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
    fontSize: 16,
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
    marginBottom: 12,
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
    marginBottom: 4,
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
    marginBottom: 2,
  },
  chartBarValue: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  qualityChartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: 12,
  },
  qualityPoint: {
    alignItems: 'center',
    flex: 1,
  },
  qualityBar: {
    width: 16,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  qualityBarFill: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  qualityValue: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 2,
  },
  qualityDate: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  correlationArea: {
    gap: 16,
    marginBottom: 16,
  },
  correlationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  correlationLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    width: 80,
  },
  correlationBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  correlationBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  correlationValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    width: 40,
    textAlign: 'right',
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
  consistencyArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  consistencyScore: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  consistencyScoreText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
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