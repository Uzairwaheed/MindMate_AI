import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, Settings, Bot } from 'lucide-react-native';
import { sleepService } from '@/services/sleepService';
import { Database } from '@/types/database';

type SleepEntry = Database['public']['Tables']['sleep_entries']['Row'];

interface SleepInsightsData {
  chartData: Array<{
    date: Date;
    duration: number | null;
  }>;
  averageDuration: number;
  sleepScore: number;
  qualityBreakdown: {
    good: number;
    okay: number;
    poor: number;
  };
  recentEntries: Array<{
    entry: SleepEntry;
    qualityLevel: 'good' | 'okay' | 'poor';
    moodText: string;
    entryScore: number;
  }>;
  quickStats: {
    bestSleepDay: string;
    averageBedtime: string;
    commonWakeMood: string;
    consistencyScore: number;
  };
}

export default function SleepInsightsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Last Week');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [insightsData, setInsightsData] = useState<SleepInsightsData>({
    chartData: [],
    averageDuration: 0,
    sleepScore: 0,
    qualityBreakdown: { good: 0, okay: 0, poor: 0 },
    recentEntries: [],
    quickStats: {
      bestSleepDay: '',
      averageBedtime: '',
      commonWakeMood: '',
      consistencyScore: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const periods = ['Last Week', 'Last Month', 'Last 3 Months'];

  useEffect(() => {
    loadSleepInsights();
  }, [selectedPeriod]);

  const loadSleepInsights = async () => {
    try {
      setLoading(true);
      
      const days = selectedPeriod === 'Last Week' ? 7 : 
                   selectedPeriod === 'Last Month' ? 30 : 90;

      const [allEntries, recentEntries] = await Promise.all([
        sleepService.getUserSleepEntries(),
        sleepService.getUserSleepEntries(5)
      ]);

      // Filter entries by selected period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const periodEntries = allEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate >= startDate && entryDate <= endDate;
      });

      // Generate chart data
      const chartData = generateChartData(periodEntries, days);
      
      // Calculate average duration
      const averageDuration = periodEntries.length > 0 
        ? periodEntries.reduce((sum, entry) => sum + entry.sleep_duration, 0) / periodEntries.length
        : 0;

      // Calculate sleep score (0-100)
      const sleepScore = calculateSleepScore(periodEntries);

      // Generate quality breakdown
      const qualityBreakdown = generateQualityBreakdown(periodEntries);

      // Process recent entries
      const processedRecentEntries = recentEntries.map(entry => ({
        entry,
        qualityLevel: getQualityLevel(entry),
        moodText: getMoodText(entry),
        entryScore: calculateEntryScore(entry),
      }));

      // Calculate quick stats
      const quickStats = calculateQuickStats(allEntries);

      setInsightsData({
        chartData,
        averageDuration,
        sleepScore,
        qualityBreakdown,
        recentEntries: processedRecentEntries,
        quickStats,
      });
    } catch (error) {
      console.error('Failed to load sleep insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (entries: SleepEntry[], days: number) => {
    const chartPoints = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const entry = entries.find(e => e.entry_date === dateStr);
      
      chartPoints.push({
        date: date,
        duration: entry ? entry.sleep_duration : null,
      });
    }
    
    return chartPoints;
  };

  const calculateSleepScore = (entries: SleepEntry[]): number => {
    if (entries.length === 0) return 0;

    let totalScore = 0;
    
    entries.forEach(entry => {
      // Duration score (40% weight)
      const durationScore = entry.sleep_duration >= 7 && entry.sleep_duration <= 9 
        ? 40 
        : Math.max(0, 40 - Math.abs(entry.sleep_duration - 8) * 5);
      
      // Quality score (35% weight)
      const qualityScore = (entry.sleep_quality / 10) * 35;
      
      // Consistency bonus (25% weight) - simplified
      const consistencyScore = 25; // Base consistency score
      
      totalScore += durationScore + qualityScore + consistencyScore;
    });

    return Math.round(totalScore / entries.length);
  };

  const generateQualityBreakdown = (entries: SleepEntry[]) => {
    if (entries.length === 0) {
      return { good: 0, okay: 0, poor: 0 };
    }

    let good = 0, okay = 0, poor = 0;

    entries.forEach(entry => {
      const quality = entry.sleep_quality;
      const duration = entry.sleep_duration;

      // Quality assessment based on duration and quality rating
      if (quality >= 7 && duration >= 7 && duration <= 9) {
        good++;
      } else if (quality >= 5 || (duration >= 6 && duration <= 10)) {
        okay++;
      } else {
        poor++;
      }
    });

    const total = entries.length;
    return {
      good: Math.round((good / total) * 100),
      okay: Math.round((okay / total) * 100),
      poor: Math.round((poor / total) * 100),
    };
  };

  const getQualityLevel = (entry: SleepEntry): 'good' | 'okay' | 'poor' => {
    const quality = entry.sleep_quality;
    const duration = entry.sleep_duration;

    if (quality >= 7 && duration >= 7 && duration <= 9) return 'good';
    if (quality >= 5 || (duration >= 6 && duration <= 10)) return 'okay';
    return 'poor';
  };

  const getMoodText = (entry: SleepEntry): string => {
    const quality = entry.sleep_quality;
    const duration = entry.sleep_duration;

    if (quality >= 8 && duration >= 7) return 'energized';
    if (quality >= 6) return 'rested';
    if (quality >= 4) return 'tired';
    return 'exhausted';
  };

  const calculateEntryScore = (entry: SleepEntry): number => {
    const durationScore = entry.sleep_duration >= 7 && entry.sleep_duration <= 9 
      ? 40 : Math.max(0, 40 - Math.abs(entry.sleep_duration - 8) * 5);
    const qualityScore = (entry.sleep_quality / 10) * 60;
    
    return Math.round(durationScore + qualityScore);
  };

  const calculateQuickStats = (entries: SleepEntry[]) => {
    if (entries.length === 0) {
      return {
        bestSleepDay: 'No data',
        averageBedtime: '00:00',
        commonWakeMood: 'No data',
        consistencyScore: 0,
      };
    }

    // Best sleep day (highest score)
    const bestEntry = entries.reduce((best, entry) => {
      const currentScore = calculateEntryScore(entry);
      const bestScore = calculateEntryScore(best);
      return currentScore > bestScore ? entry : best;
    });

    const bestSleepDay = new Date(bestEntry.entry_date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    // Average bedtime
    const bedtimes = entries.map(e => e.bedtime);
    const avgBedtime = calculateAverageTime(bedtimes);

    // Most common wake mood
    const moods = entries.map(e => e.mood_after_sleep);
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonWakeMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 'Energized'
    );

    // Consistency score
    const consistencyScore = calculateConsistencyScore(entries);

    return {
      bestSleepDay,
      averageBedtime: avgBedtime,
      commonWakeMood,
      consistencyScore,
    };
  };

  const calculateAverageTime = (times: string[]): string => {
    if (times.length === 0) return '00:00';
    
    const totalMinutes = times.reduce((sum, time) => {
      const [hour, min] = time.split(':').map(Number);
      return sum + (hour * 60 + min);
    }, 0);
    
    const avgMinutes = totalMinutes / times.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateConsistencyScore = (entries: SleepEntry[]): number => {
    if (entries.length < 2) return 0;

    const bedtimes = entries.map(e => e.bedtime);
    const waketimes = entries.map(e => e.wake_time);

    const bedtimeVariance = calculateTimeVariance(bedtimes);
    const waketimeVariance = calculateTimeVariance(waketimes);

    const avgVariance = (bedtimeVariance + waketimeVariance) / 2;
    const consistencyScore = Math.max(0, 100 - (avgVariance * 10));

    return Math.round(consistencyScore);
  };

  const calculateTimeVariance = (times: string[]): number => {
    if (times.length < 2) return 0;

    const minutes = times.map(time => {
      const [hour, min] = time.split(':').map(Number);
      return hour * 60 + min;
    });

    const avg = minutes.reduce((sum, min) => sum + min, 0) / minutes.length;
    const variance = minutes.reduce((sum, min) => sum + Math.pow(min - avg, 2), 0) / minutes.length;
    
    return Math.sqrt(variance) / 60;
  };

  const renderSleepChart = () => {
    if (insightsData.chartData.length === 0 || insightsData.chartData.every(d => d.duration === null)) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No sleep data available</Text>
          <Text style={styles.noDataSubtext}>Start logging your sleep to see trends</Text>
        </View>
      );
    }

    const maxDuration = Math.max(...insightsData.chartData.map(d => d.duration || 0), 12);
    const chartHeight = 120;
    const chartWidth = 280;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[12, 9, 6, 3, 0].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value}</Text>
            ))}
          </View>
          
          {/* Chart content */}
          <View style={styles.chartContent}>
            {/* Grid lines */}
            <View style={styles.chartGrid}>
              {[0, 25, 50, 75, 100].map(value => (
                <View key={value} style={styles.gridLine} />
              ))}
            </View>
            
            {/* Data points and lines */}
            <View style={styles.dataContainer}>
              {insightsData.chartData.map((point, index) => {
                if (!point.duration) return null;
                
                const x = (index / (insightsData.chartData.length - 1)) * 100;
                const y = ((12 - point.duration) / 12) * 100;
                
                return (
                  <View key={index}>
                    {/* Data point */}
                    <View 
                      style={[
                        styles.dataPoint,
                        { 
                          left: `${x}%`,
                          top: `${y}%`,
                        }
                      ]} 
                    />
                    
                    {/* Line to next point */}
                    {index < insightsData.chartData.length - 1 && (
                      (() => {
                        const nextPoint = insightsData.chartData[index + 1];
                        if (!nextPoint.duration) return null;
                        
                        const x2 = ((index + 1) / (insightsData.chartData.length - 1)) * 100;
                        const y2 = ((12 - nextPoint.duration) / 12) * 100;
                        
                        const lineLength = Math.sqrt(
                          Math.pow((x2 - x) * chartWidth / 100, 2) + 
                          Math.pow((y2 - y) * chartHeight / 100, 2)
                        );
                        const angle = Math.atan2((y2 - y) * chartHeight / 100, (x2 - x) * chartWidth / 100) * 180 / Math.PI;
                        
                        return (
                          <View
                            style={[
                              styles.chartLine,
                              {
                                left: `${x}%`,
                                top: `${y}%`,
                                width: lineLength,
                                transform: [{ rotate: `${angle}deg` }],
                              }
                            ]}
                          />
                        );
                      })()
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {insightsData.chartData.filter((_, index) => index % Math.ceil(insightsData.chartData.length / 4) === 0).map((point, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderQualityDonut = () => {
    const { good, okay, poor } = insightsData.qualityBreakdown;
    
    if (good === 0 && okay === 0 && poor === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No quality data available</Text>
        </View>
      );
    }

    // Calculate angles for pie chart
    const total = good + okay + poor;
    const goodAngle = (good / total) * 360;
    const okayAngle = (okay / total) * 360;
    const poorAngle = (poor / total) * 360;
    
    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutChart}>
          {/* Simplified pie chart representation */}
          <View style={[styles.pieSegment, styles.goodSegment, { 
            transform: [{ rotate: '0deg' }] 
          }]} />
          <View style={[styles.pieSegment, styles.okaySegment, { 
            transform: [{ rotate: `${goodAngle}deg` }] 
          }]} />
          <View style={[styles.pieSegment, styles.poorSegment, { 
            transform: [{ rotate: `${goodAngle + okayAngle}deg` }] 
          }]} />
        </View>
        
        <View style={styles.donutLegend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendLabel}>Good: {good}</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendLabel}>Okay: {okay}</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendLabel}>Poor: {poor}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getQualityColor = (level: 'good' | 'okay' | 'poor') => {
    switch (level) {
      case 'good': return '#22C55E';
      case 'okay': return '#F59E0B';
      case 'poor': return '#EF4444';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'energized': return '⚡';
      case 'rested': return '😊';
      case 'tired': return '😴';
      case 'exhausted': return '😵';
      default: return '😊';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Sleep Insights</Text>
        
        <TouchableOpacity
          style={styles.periodSelector}
          onPress={() => setShowPeriodModal(true)}
        >
          <Text style={styles.periodText}>{selectedPeriod}</Text>
          <ChevronDown size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sleep Duration Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Sleep Duration Trend</Text>
          {renderSleepChart()}
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average Sleep</Text>
            <Text style={styles.metricValue}>
              {loading ? '...' : `${insightsData.averageDuration.toFixed(1)}h`}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Sleep Score</Text>
            <Text style={styles.metricValue}>
              {loading ? '...' : `${insightsData.sleepScore}/100`}
            </Text>
          </View>
        </View>

        {/* Sleep Quality Breakdown */}
        <View style={styles.qualitySection}>
          <Text style={styles.sectionTitle}>Sleep Quality Breakdown</Text>
          {renderQualityDonut()}
        </View>

        {/* Recent Sleep Entries */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Sleep Entries</Text>
          <View style={styles.recentEntriesContainer}>
            {insightsData.recentEntries.length > 0 ? (
              insightsData.recentEntries.slice(0, 3).map((item, index) => {
                const { entry, qualityLevel, moodText, entryScore } = item;
                
                return (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={styles.entryLeft}>
                      <Text style={styles.entryDay}>
                        {new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short' })}, {new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.entryDuration}>
                        {sleepService.formatDuration(entry.sleep_duration)}
                      </Text>
                      <View style={styles.entryTimes}>
                        <Text style={styles.entryTime}>🌙 {entry.bedtime}</Text>
                        <Text style={styles.entryTime}>☀️ {entry.wake_time}</Text>
                        <Text style={styles.entryScore}>⭐ {entryScore}/100</Text>
                      </View>
                    </View>
                    
                    <View style={styles.entryRight}>
                      <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(qualityLevel) }]}>
                        <Text style={styles.qualityBadgeText}>{qualityLevel}</Text>
                      </View>
                      <Text style={styles.moodText}>
                        {getMoodEmoji(moodText)} {moodText}
                      </Text>
                      <View style={styles.sleepPattern}>
                        <View style={[styles.sleepBar, { backgroundColor: '#22C55E', flex: qualityLevel === 'good' ? 0.6 : 0.3 }]} />
                        <View style={[styles.sleepBar, { backgroundColor: '#F59E0B', flex: qualityLevel === 'okay' ? 0.5 : 0.3 }]} />
                        <View style={[styles.sleepBar, { backgroundColor: '#EF4444', flex: qualityLevel === 'poor' ? 0.4 : 0.1 }]} />
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No recent sleep entries</Text>
                <TouchableOpacity
                  style={styles.logSleepButton}
                  onPress={() => router.push('/sleep/log')}
                >
                  <Text style={styles.logSleepButtonText}>Log Your Sleep</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Best Sleep Day</Text>
                <Text style={styles.statValue}>{insightsData.quickStats.bestSleepDay}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average Bedtime</Text>
                <Text style={styles.statValue}>{insightsData.quickStats.averageBedtime}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Common Wake Mood</Text>
                <Text style={styles.statValue}>
                  {getMoodEmoji(insightsData.quickStats.commonWakeMood)} {insightsData.quickStats.commonWakeMood}
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Consistency Score</Text>
                <Text style={styles.statValue}>{insightsData.quickStats.consistencyScore}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#9CA3AF" />
            <Text style={styles.settingsButtonText}>Sleep Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.aiHelpButton}>
            <Bot size={20} color="#FFFFFF" />
            <Text style={styles.aiHelpButtonText}>AI Sleep Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Period Selection Modal */}
      <Modal
        visible={showPeriodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowPeriodModal(false)}
        >
          <View style={styles.modalContent}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedPeriod(period);
                  setShowPeriodModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedPeriod === period && styles.modalOptionTextActive
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f36',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#1a1f36',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginRight: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#1a1f36',
    paddingHorizontal: 16,
  },
  chartSection: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartContainer: {
    height: 160,
  },
  chartArea: {
    flexDirection: 'row',
    height: 120,
    marginBottom: 12,
  },
  yAxis: {
    width: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dataContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: -4,
    marginTop: -4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#3B82F6',
    transformOrigin: 'left center',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 28,
  },
  xAxisLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  logSleepButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  logSleepButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#2d3748',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  qualitySection: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  donutContainer: {
    alignItems: 'center',
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    marginBottom: 20,
    backgroundColor: '#22C55E',
  },
  pieSegment: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  goodSegment: {
    backgroundColor: '#22C55E',
  },
  okaySegment: {
    backgroundColor: '#F59E0B',
  },
  poorSegment: {
    backgroundColor: '#EF4444',
  },
  donutLegend: {
    alignItems: 'flex-start',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  recentSection: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  recentEntriesContainer: {
    gap: 16,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  entryLeft: {
    flex: 1,
  },
  entryDay: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  entryDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  entryTimes: {
    flexDirection: 'row',
    gap: 8,
  },
  entryTime: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  entryScore: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  qualityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  qualityBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  moodText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sleepPattern: {
    flexDirection: 'column',
    width: 20,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sleepBar: {
    width: '100%',
  },
  quickStatsSection: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  quickStatsContainer: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2d3748',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  aiHelpButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHelpButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalOptionTextActive: {
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
});