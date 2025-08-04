import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, Settings, Bot } from 'lucide-react-native';
import { sleepService } from '@/services/sleepService';
import { Database } from '@/types/database';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';

type SleepEntry = Database['public']['Tables']['sleep_entries']['Row'];

interface ChartDataPoint {
  date: Date;
  duration: number | null;
  x: number;
  y: number;
}

interface QualityBreakdown {
  good: number;
  okay: number;
  poor: number;
}

interface ProcessedEntry {
  entry: SleepEntry;
  qualityLevel: 'good' | 'okay' | 'poor';
  moodText: string;
  moodEmoji: string;
  entryScore: number;
  qualityColor: string;
}

export default function SleepInsightsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Last Week');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [averageSleep, setAverageSleep] = useState(0);
  const [sleepScore, setSleepScore] = useState(0);
  const [qualityBreakdown, setQualityBreakdown] = useState<QualityBreakdown>({ good: 0, okay: 0, poor: 0 });
  const [recentEntries, setRecentEntries] = useState<ProcessedEntry[]>([]);
  const [quickStats, setQuickStats] = useState({
    bestSleepDay: '',
    averageBedtime: '',
    commonWakeMood: '',
    consistencyScore: 0,
  });
  const [loading, setLoading] = useState(true);

  const periods = ['Last Week', 'Last Month', 'Last 3 Months'];

  useEffect(() => {
    loadSleepData();
  }, [selectedPeriod]);

  const loadSleepData = async () => {
    try {
      setLoading(true);
      
      const days = selectedPeriod === 'Last Week' ? 7 : 
                   selectedPeriod === 'Last Month' ? 30 : 90;

      // Get all entries for the selected period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const entries = await sleepService.getSleepEntriesByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      setSleepEntries(entries);

      // Process chart data
      const processedChartData = generateChartData(entries, days);
      setChartData(processedChartData);

      // Calculate average sleep
      const avgSleep = entries.length > 0 
        ? entries.reduce((sum, entry) => sum + entry.sleep_duration, 0) / entries.length
        : 0;
      setAverageSleep(avgSleep);

      // Calculate sleep score
      const score = calculateSleepScore(entries);
      setSleepScore(score);

      // Calculate quality breakdown
      const breakdown = calculateQualityBreakdown(entries);
      setQualityBreakdown(breakdown);

      // Process recent entries
      const processed = processRecentEntries(entries.slice(0, 5));
      setRecentEntries(processed);

      // Calculate quick stats
      const stats = calculateQuickStats(entries);
      setQuickStats(stats);

    } catch (error) {
      console.error('Failed to load sleep data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (entries: SleepEntry[], days: number): ChartDataPoint[] => {
    const chartPoints: ChartDataPoint[] = [];
    const chartWidth = 280;
    const chartHeight = 120;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const entry = entries.find(e => e.entry_date === dateStr);
      const duration = entry ? entry.sleep_duration : null;
      
      // Calculate x,y coordinates for chart
      const x = (days - 1 - i) / (days - 1) * chartWidth;
      const y = duration ? (12 - duration) / 12 * chartHeight : chartHeight / 2;
      
      chartPoints.push({
        date,
        duration,
        x,
        y,
      });
    }
    
    return chartPoints;
  };

  const calculateSleepScore = (entries: SleepEntry[]): number => {
    if (entries.length === 0) return 0;

    let totalScore = 0;
    
    entries.forEach(entry => {
      // Duration score (40% weight) - optimal 7-9 hours
      let durationScore = 0;
      if (entry.sleep_duration >= 7 && entry.sleep_duration <= 9) {
        durationScore = 40;
      } else {
        const deviation = Math.abs(entry.sleep_duration - 8);
        durationScore = Math.max(0, 40 - (deviation * 8));
      }
      
      // Quality score (35% weight) - based on 1-10 rating
      const qualityScore = (entry.sleep_quality / 10) * 35;
      
      // Consistency bonus (25% weight) - simplified for now
      const consistencyScore = 25;
      
      totalScore += durationScore + qualityScore + consistencyScore;
    });

    return Math.round(totalScore / entries.length);
  };

  const calculateQualityBreakdown = (entries: SleepEntry[]): QualityBreakdown => {
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
      } else if (quality >= 5 && duration >= 6 && duration <= 10) {
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

  const processRecentEntries = (entries: SleepEntry[]): ProcessedEntry[] => {
    return entries.map(entry => {
      const quality = entry.sleep_quality;
      const duration = entry.sleep_duration;
      
      // Determine quality level
      let qualityLevel: 'good' | 'okay' | 'poor' = 'poor';
      let qualityColor = '#EF4444';
      
      if (quality >= 7 && duration >= 7 && duration <= 9) {
        qualityLevel = 'good';
        qualityColor = '#22C55E';
      } else if (quality >= 5 && duration >= 6 && duration <= 10) {
        qualityLevel = 'okay';
        qualityColor = '#F59E0B';
      }

      // Determine mood
      let moodText = 'tired';
      let moodEmoji = '😴';
      
      if (quality >= 8 && duration >= 7) {
        moodText = 'energized';
        moodEmoji = '⚡';
      } else if (quality >= 6) {
        moodText = 'rested';
        moodEmoji = '😊';
      } else if (quality >= 4) {
        moodText = 'tired';
        moodEmoji = '😴';
      } else {
        moodText = 'exhausted';
        moodEmoji = '😵';
      }

      // Calculate entry score
      const durationScore = duration >= 7 && duration <= 9 
        ? 40 : Math.max(0, 40 - Math.abs(duration - 8) * 5);
      const qualityScore = (quality / 10) * 60;
      const entryScore = Math.round(durationScore + qualityScore);

      return {
        entry,
        qualityLevel,
        moodText,
        moodEmoji,
        entryScore,
        qualityColor,
      };
    });
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
    let bestEntry = entries[0];
    let bestScore = 0;
    
    entries.forEach(entry => {
      const score = calculateSleepScore([entry]);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
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
    if (chartData.length === 0 || chartData.every(d => d.duration === null)) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No sleep data available</Text>
        </View>
      );
    }

    const chartWidth = 280;
    const chartHeight = 120;
    const validPoints = chartData.filter(d => d.duration !== null);

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight + 40} style={styles.chart}>
          {/* Grid lines */}
          {[0, 3, 6, 9, 12].map((hour, index) => {
            const y = (12 - hour) / 12 * chartHeight;
            return (
              <Line
                key={`grid-${hour}`}
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 3, 6, 9, 12].map((hour, index) => {
            const y = (12 - hour) / 12 * chartHeight;
            return (
              <SvgText
                key={`y-label-${hour}`}
                x="-10"
                y={y + 4}
                fontSize="12"
                fill="#9CA3AF"
                textAnchor="end"
              >
                {hour}
              </SvgText>
            );
          })}

          {/* Chart line */}
          {validPoints.length > 1 && (
            <Path
              d={`M ${validPoints.map(point => `${point.x},${point.y}`).join(' L ')}`}
              stroke="#3B82F6"
              strokeWidth="2"
              fill="none"
            />
          )}

          {/* Data points */}
          {validPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}

          {/* X-axis labels */}
          {chartData.filter((_, index) => index % Math.ceil(chartData.length / 4) === 0).map((point, index) => (
            <SvgText
              key={`x-label-${index}`}
              x={point.x}
              y={chartHeight + 20}
              fontSize="12"
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </SvgText>
          ))}
        </Svg>
      </View>
    );
  };

  const renderQualityPieChart = () => {
    if (qualityBreakdown.good === 0 && qualityBreakdown.okay === 0 && qualityBreakdown.poor === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No quality data</Text>
        </View>
      );
    }

    const total = qualityBreakdown.good + qualityBreakdown.okay + qualityBreakdown.poor;
    const radius = 60;
    const centerX = 80;
    const centerY = 80;

    // Calculate angles
    const goodAngle = (qualityBreakdown.good / total) * 360;
    const okayAngle = (qualityBreakdown.okay / total) * 360;
    const poorAngle = (qualityBreakdown.poor / total) * 360;

    // Create path data for pie segments
    const createArcPath = (startAngle: number, endAngle: number) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
      return [
        "M", centerX, centerY,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
      ].join(" ");
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    let currentAngle = 0;

    return (
      <View style={styles.pieChartContainer}>
        <Svg width={160} height={160}>
          {/* Good segment */}
          {qualityBreakdown.good > 0 && (
            <Path
              d={createArcPath(currentAngle, currentAngle + goodAngle)}
              fill="#22C55E"
            />
          )}
          
          {/* Okay segment */}
          {qualityBreakdown.okay > 0 && (
            <Path
              d={createArcPath(currentAngle + goodAngle, currentAngle + goodAngle + okayAngle)}
              fill="#F59E0B"
            />
          )}
          
          {/* Poor segment */}
          {qualityBreakdown.poor > 0 && (
            <Path
              d={createArcPath(currentAngle + goodAngle + okayAngle, 360)}
              fill="#EF4444"
            />
          )}
        </Svg>
        
        <View style={styles.pieChartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Good: {qualityBreakdown.good}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Okay: {qualityBreakdown.okay}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Poor: {qualityBreakdown.poor}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSleepPatternBar = (entry: ProcessedEntry) => {
    // Create visual sleep pattern based on quality and duration
    const { qualityLevel, entry: sleepEntry } = entry;
    const duration = sleepEntry.sleep_duration;
    
    // Calculate sleep stages based on quality and duration
    let deepPercent = 20;
    let lightPercent = 65;
    let awakePercent = 15;
    
    if (qualityLevel === 'good') {
      deepPercent = 30;
      lightPercent = 60;
      awakePercent = 10;
    } else if (qualityLevel === 'poor') {
      deepPercent = 10;
      lightPercent = 60;
      awakePercent = 30;
    }

    return (
      <View style={styles.sleepPatternBar}>
        <View style={[styles.sleepStage, { flex: deepPercent, backgroundColor: '#22C55E' }]} />
        <View style={[styles.sleepStage, { flex: lightPercent, backgroundColor: '#F59E0B' }]} />
        <View style={[styles.sleepStage, { flex: awakePercent, backgroundColor: '#EF4444' }]} />
      </View>
    );
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
              {loading ? '...' : `${averageSleep.toFixed(1)}h`}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Sleep Score</Text>
            <Text style={styles.metricValue}>
              {loading ? '...' : `${sleepScore}/100`}
            </Text>
          </View>
        </View>

        {/* Sleep Quality Breakdown */}
        <View style={styles.qualitySection}>
          <Text style={styles.sectionTitle}>Sleep Quality Breakdown</Text>
          {renderQualityPieChart()}
        </View>

        {/* Recent Sleep Entries */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Sleep Entries</Text>
          {recentEntries.length > 0 ? (
            recentEntries.map((item, index) => {
              const { entry, qualityLevel, moodText, moodEmoji, entryScore, qualityColor } = item;
              
              return (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryDate}>
                      {new Date(entry.entry_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.entryDuration}>
                      {sleepService.formatDuration(entry.sleep_duration)}
                    </Text>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryTime}>🌙 {entry.bedtime}</Text>
                      <Text style={styles.entryTime}>☀️ {entry.wake_time}</Text>
                      <Text style={styles.entryScore}>⭐ {entryScore}/100</Text>
                    </View>
                  </View>
                  
                  <View style={styles.entryRight}>
                    <View style={[styles.qualityBadge, { backgroundColor: qualityColor }]}>
                      <Text style={styles.qualityBadgeText}>{qualityLevel}</Text>
                    </View>
                    <Text style={styles.moodText}>
                      {moodEmoji} {moodText}
                    </Text>
                    {renderSleepPatternBar(item)}
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

        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>Best Sleep Day</Text>
              <Text style={styles.quickStatValue}>{quickStats.bestSleepDay}</Text>
            </View>
            
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>Average Bedtime</Text>
              <Text style={styles.quickStatValue}>{quickStats.averageBedtime}</Text>
            </View>
            
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>Common Wake Mood</Text>
              <Text style={styles.quickStatValue}>
                {getMoodEmoji(quickStats.commonWakeMood)} {quickStats.commonWakeMood}
              </Text>
            </View>
            
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>Consistency Score</Text>
              <Text style={styles.quickStatValue}>{quickStats.consistencyScore}%</Text>
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
    alignItems: 'center',
  },
  chart: {
    marginLeft: 20,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
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
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartLegend: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
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
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  entryLeft: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  entryDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  entryDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  entryTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  entryScore: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  qualityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  },
  sleepPatternBar: {
    flexDirection: 'column',
    width: 20,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sleepStage: {
    width: '100%',
  },
  quickStatsSection: {
    backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickStatCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickStatValue: {
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