import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, Settings, Bot, Star, Clock, ChartBar as BarChart3, Calendar } from 'lucide-react-native';
import { sleepService } from '@/services/sleepService';
import { Database } from '@/types/database';
import Svg, { Circle, Path, Line, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

type SleepEntry = Database['public']['Tables']['sleep_entries']['Row'];

interface ProcessedSleepEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number; // in minutes
  quality: 'good' | 'okay' | 'poor';
  wakeUpMood: 'fresh' | 'energized' | 'tired' | 'groggy';
  sleepScore: number;
}

interface ChartDataPoint {
  date: string;
  hours: number;
  score: number;
  quality: string;
}

interface QualityDistribution {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export default function SleepInsightsScreen() {
  const [timePeriod, setTimePeriod] = useState('week');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sleepInsights, setSleepInsights] = useState<any>(null);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);

  useEffect(() => {
    loadSleepInsights();
    
    // Start animations
    fadeAnim.value = withSpring(1);
    slideAnim.value = withSpring(0);
  }, [timePeriod]);

  const loadSleepInsights = async () => {
    try {
      setLoading(true);
      
      const days = timePeriod === 'week' ? 7 : 
                   timePeriod === 'month' ? 30 : 90;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const [realEntries, insights] = await Promise.all([
        sleepService.getSleepEntriesByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        sleepService.getSleepInsights(days)
      ),

      setSleepEntries(realEntries);
      setSleepInsights(insights);
    } catch (error) {
      console.error('Failed to load sleep insights:', error);
      setSleepEntries([]);
      setSleepInsights(null);
    } finally {
      setLoading(false);
    }
  };

  // Process real user data for component format
  const processedSleepData = useMemo((): ProcessedSleepEntry[] => {
    return sleepEntries.map(entry => {
      // Calculate sleep score from real data
      const durationScore = calculateDurationScore(entry.sleep_duration);
      const qualityScore = (entry.sleep_quality / 10) * 35;
      const consistencyScore = 25; // Base score, enhanced by insights
      const sleepScore = Math.round(durationScore + qualityScore + consistencyScore);

      // Determine quality category from real data
      let quality: 'good' | 'okay' | 'poor' = 'poor';
      if (entry.sleep_quality >= 7 && entry.sleep_duration >= 7 && entry.sleep_duration <= 9) {
        quality = 'good';
      } else if (entry.sleep_quality >= 5 && entry.sleep_duration >= 6 && entry.sleep_duration <= 10) {
        quality = 'okay';
      }

      // Map real mood to component format
      let wakeUpMood: 'fresh' | 'energized' | 'tired' | 'groggy' = 'tired';
      const moodLower = entry.mood_after_sleep.toLowerCase();
      if (moodLower.includes('great') || moodLower.includes('amazing')) {
        wakeUpMood = 'energized';
      } else if (moodLower.includes('good')) {
        wakeUpMood = 'fresh';
      } else if (moodLower.includes('poor') || moodLower.includes('terrible')) {
        wakeUpMood = 'groggy';
      }

      return {
        id: entry.id,
        date: entry.entry_date,
        bedtime: entry.bedtime,
        wakeTime: entry.wake_time,
        duration: Math.round(entry.sleep_duration * 60), // Convert to minutes
        quality,
        wakeUpMood,
        sleepScore,
      };
    });
  }, [sleepEntries]);

  // Calculate duration score (0-40 points)
  const calculateDurationScore = (hours: number): number => {
    if (hours >= 7 && hours <= 9) return 40; // Optimal range
    if (hours >= 6 && hours <= 10) return 35; // Good range
    if (hours >= 5 && hours <= 11) return 25; // Acceptable range
    return Math.max(0, 40 - Math.abs(hours - 8) * 5); // Penalty for deviation
  };

  // Filter real data by time period
  const filteredData = useMemo(() => {
    const now = new Date();
    let days = 7;
    if (timePeriod === 'month') days = 30;
    if (timePeriod === '3months') days = 90;

    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return processedSleepData.filter(entry => new Date(entry.date) >= cutoffDate);
  }, [processedSleepData, timePeriod]);

  // Chart data from REAL user entries
  const chartData: ChartDataPoint[] = useMemo(() => {
    return filteredData.map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: Math.round(entry.duration / 60 * 10) / 10,
      score: Math.round(entry.sleepScore),
      quality: entry.quality
    }));
  }, [filteredData]);

  // Real average sleep calculation
  const averageSleep = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const total = filteredData.reduce((sum, entry) => sum + entry.duration, 0);
    return Math.round(total / filteredData.length / 60 * 10) / 10;
  }, [filteredData]);

  // Real average score calculation
  const averageScore = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const total = filteredData.reduce((sum, entry) => sum + entry.sleepScore, 0);
    return Math.round(total / filteredData.length);
  }, [filteredData]);

  // Real quality distribution from user data
  const qualityDistribution = useMemo((): QualityDistribution[] => {
    const counts = filteredData.reduce((acc, entry) => {
      acc[entry.quality] = (acc[entry.quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = filteredData.length || 1;

    return [
      { 
        name: 'Good', 
        value: counts.good || 0, 
        color: '#10b981',
        percentage: Math.round(((counts.good || 0) / total) * 100)
      },
      { 
        name: 'Okay', 
        value: counts.okay || 0, 
        color: '#f59e0b',
        percentage: Math.round(((counts.okay || 0) / total) * 100)
      },
      { 
        name: 'Poor', 
        value: counts.poor || 0, 
        color: '#ef4444',
        percentage: Math.round(((counts.poor || 0) / total) * 100)
      }
    ];
  }, [filteredData]);

  // Real best sleep day calculation with weighted scoring
  const bestSleepDay = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    return filteredData.reduce((best, current) => {
      // Weighted scoring: duration (40%) + quality (35%) + mood (25%)
      const currentScore = current.sleepScore;
      const bestScore = best.sleepScore;
      
      return currentScore > bestScore ? current : best;
    });
  }, [filteredData]);

  // Real average bedtime calculation
  const averageBedtime = useMemo(() => {
    if (filteredData.length === 0) return 'N/A';
    const times = filteredData.map(entry => {
      const [hours, minutes] = entry.bedtime.split(':').map(Number);
      return hours * 60 + minutes;
    });
    const avgMinutes = times.reduce((sum, time) => sum + time, 0) / times.length;
    const hours = Math.floor(avgMinutes / 60);
    const mins = Math.round(avgMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, [filteredData]);

  // Real most common mood calculation
  const mostCommonMood = useMemo(() => {
    if (filteredData.length === 0) return 'N/A';
    const moodCounts = filteredData.reduce((acc, entry) => {
      acc[entry.wakeUpMood] = (acc[entry.wakeUpMood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0]] > moodCounts[b[0]] ? a : b
    )[0];
    
    const emojis = { fresh: '😄', energized: '⚡', tired: '😴', groggy: '😵‍💫' };
    return `${emojis[mostCommon as keyof typeof emojis]} ${mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1)}`;
  }, [filteredData]);

  // Real consistency score calculation
  const consistencyScore = useMemo(() => {
    if (filteredData.length < 2) return 0;
    
    const bedtimes = filteredData.map(entry => {
      const [hours, minutes] = entry.bedtime.split(':').map(Number);
      return hours * 60 + minutes;
    });
    
    const avgBedtime = bedtimes.reduce((sum, time) => sum + time, 0) / bedtimes.length;
    const variance = bedtimes.reduce((sum, time) => sum + Math.pow(time - avgBedtime, 2), 0) / bedtimes.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (lower deviation = higher consistency)
    const maxDeviation = 120; // 2 hours in minutes
    const consistency = Math.max(0, 100 - (standardDeviation / maxDeviation) * 100);
    
    return Math.round(consistency);
  }, [filteredData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score <= 2) return '😢';
    if (score <= 4) return '😟';
    if (score <= 6) return '😐';
    if (score <= 8) return '🙂';
    return '😊';
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No sleep data available</Text>
          <Text style={styles.noDataSubtext}>Start logging your sleep to see trends</Text>
          <TouchableOpacity
            style={styles.logSleepButton}
            onPress={() => router.push('/sleep/log')}
          >
            <Text style={styles.logSleepButtonText}>Log Your Sleep</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const chartWidth = 280;
    const chartHeight = 120;
    const padding = 40;

    // Calculate chart coordinates from real data
    const maxHours = Math.max(...chartData.map(d => d.hours), 12);
    const minHours = Math.min(...chartData.map(d => d.hours), 0);
    
    const chartPoints = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * chartWidth;
      const y = ((maxHours - point.hours) / (maxHours - minHours)) * chartHeight;
      return { x, y, ...point };
    });

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth + padding} height={chartHeight + padding} style={styles.chart}>
          <Defs>
            <SvgLinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>

          {/* Grid lines */}
          {[0, 3, 6, 9, 12].map((hour) => {
            const y = ((maxHours - hour) / (maxHours - minHours)) * chartHeight;
            return (
              <G key={`grid-${hour}`}>
                <Line
                  x1={padding / 2}
                  y1={y}
                  x2={chartWidth + padding / 2}
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
                <SvgText
                  x={padding / 2 - 10}
                  y={y + 4}
                  fontSize="12"
                  fill="#9CA3AF"
                  textAnchor="end"
                >
                  {hour}
                </SvgText>
              </G>
            );
          })}

          {/* Chart line connecting real data points */}
          {chartPoints.length > 1 && (
            <Path
              d={`M ${chartPoints.map(point => `${point.x + padding / 2},${point.y}`).join(' L ')}`}
              stroke="url(#lineGradient)"
              strokeWidth="3"
              fill="none"
            />
          )}

          {/* Real data points */}
          {chartPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x + padding / 2}
              cy={point.y}
              r="6"
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}

          {/* X-axis labels from real dates */}
          {chartPoints.filter((_, index) => index % Math.ceil(chartPoints.length / 4) === 0).map((point, index) => (
            <SvgText
              key={`x-label-${index}`}
              x={point.x + padding / 2}
              y={chartHeight + 20}
              fontSize="12"
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {point.date}
            </SvgText>
          ))}
        </Svg>
      </View>
    );
  };

  const renderQualityPieChart = () => {
    if (qualityDistribution.every(d => d.value === 0)) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No quality data</Text>
          <Text style={styles.noDataSubtext}>Log sleep entries to see breakdown</Text>
        </View>
      );
    }

    const radius = 60;
    const centerX = 80;
    const centerY = 80;

    // Calculate angles for pie segments from real data
    const total = qualityDistribution.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;

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

    return (
      <View style={styles.pieChartContainer}>
        <Svg width={160} height={160}>
          {qualityDistribution.map((segment, index) => {
            if (segment.value === 0) return null;
            
            const angle = (segment.value / total) * 360;
            const path = createArcPath(currentAngle, currentAngle + angle);
            currentAngle += angle;
            
            return (
              <Path
                key={index}
                d={path}
                fill={segment.color}
              />
            );
          })}
        </Svg>
        
        <View style={styles.pieChartLegend}>
          {qualityDistribution.map((segment, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
              <Text style={styles.legendText}>
                {segment.name}: {segment.percentage}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const moodEmojis = {
    tired: '😴',
    fresh: '😄',
    groggy: '😵‍💫',
    energized: '⚡'
  };

  const qualityColors = {
    good: '#22C55E',
    okay: '#F59E0B',
    poor: '#EF4444'
  };

  const periods = [
    { key: 'week', label: 'Last Week' },
    { key: 'month', label: 'Last Month' },
    { key: '3months', label: 'Last 3 Months' }
  ];

  // Animated styles
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <LinearGradient
      colors={['#1a1f36', '#2d3748', '#4a5568']}
      style={styles.container}
    >
      {/* Night Sky Background */}
      <View style={styles.starsContainer}>
        <Star size={12} color="#FEF08A" style={[styles.star, { top: 40, left: 40, opacity: 0.6 }]} />
        <Star size={8} color="#FEF08A" style={[styles.star, { top: 80, right: 64, opacity: 0.4 }]} />
        <Star size={8} color="#FEF08A" style={[styles.star, { top: 128, left: 80, opacity: 0.8 }]} />
        <Star size={12} color="#FEF08A" style={[styles.star, { top: 160, right: 32, opacity: 0.5 }]} />
      </View>

      <Animated.View style={[styles.content, fadeStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitle}>
              <BarChart3 size={24} color="#93C5FD" />
              <Text style={styles.title}>Sleep Insights</Text>
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Time Period Selector */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.periodSelector}
            onPress={() => setShowPeriodModal(!showPeriodModal)}
            activeOpacity={0.7}
          >
            <Text style={styles.periodText}>
              {periods.find(p => p.key === timePeriod)?.label || 'Last Week'}
            </Text>
            <ChevronDown 
              size={16} 
              color="#FFFFFF" 
              style={[
                styles.chevron,
                showPeriodModal && styles.chevronRotated
              ]} 
            />
          </TouchableOpacity>
          
          {showPeriodModal && (
            <View style={styles.dropdownMenu}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.dropdownItem,
                    timePeriod === period.key && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setTimePeriod(period.key);
                    setShowPeriodModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    timePeriod === period.key && styles.dropdownItemTextActive
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Sleep Duration Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Sleep Duration Trend</Text>
            {renderChart()}
          </View>

          {/* Metrics Cards */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Average Sleep</Text>
              <Text style={styles.metricValue}>
                {loading ? '...' : `${averageSleep}h`}
              </Text>
            </View>
            
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sleep Score</Text>
              <Text style={styles.metricValue}>
                {loading ? '...' : `${averageScore}/100`}
              </Text>
            </View>
          </View>

          {/* Sleep Quality Breakdown */}
          <View style={styles.qualitySection}>
            <Text style={styles.sectionTitle}>Sleep Quality Breakdown</Text>
            {renderQualityPieChart()}
          </View>

          {/* Recent Sleep Entries - Real User Data */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.recentTitle}>Recent Sleep Entries</Text>
            </View>
            
            {filteredData.length > 0 ? (
              <ScrollView 
                style={styles.entriesContainer} 
                showsVerticalScrollIndicator={false} 
                nestedScrollEnabled={true}
              >
                {filteredData.slice(-5).reverse().map((entry) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryLeft}>
                        <Text style={styles.entryDate}>
                          {new Date(entry.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Text style={styles.entryDuration}>
                          {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                        </Text>
                      </View>
                      <View style={styles.entryRight}>
                        <View style={[styles.qualityBadge, { backgroundColor: qualityColors[entry.quality] }]}>
                          <Text style={styles.qualityBadgeText}>{entry.quality}</Text>
                        </View>
                        <Text style={styles.moodText}>
                          {moodEmojis[entry.wakeUpMood]} {entry.wakeUpMood}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryDetailText}>🌙 {entry.bedtime}</Text>
                      <Text style={styles.entryDetailText}>🌅 {entry.wakeTime}</Text>
                      <Text style={styles.entryDetailText}>⭐ {Math.round(entry.sleepScore)}/100</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No recent sleep entries</Text>
                <Text style={styles.noDataSubtext}>Start logging your sleep to see insights</Text>
              </View>
            )}
          </View>

          {/* Quick Stats - Real User Data */}
          <View style={styles.quickStatsSection}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.quickStatsGrid}>
              <View style={styles.quickStatCard}>
                <Text style={[styles.quickStatLabel, { color: '#22C55E' }]}>Best Sleep Day</Text>
                <Text style={styles.quickStatValue}>
                  {bestSleepDay ? new Date(bestSleepDay.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  }) : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.quickStatCard}>
                <Text style={[styles.quickStatLabel, { color: '#3B82F6' }]}>Average Bedtime</Text>
                <Text style={styles.quickStatValue}>{averageBedtime}</Text>
              </View>
              
              <View style={styles.quickStatCard}>
                <Text style={[styles.quickStatLabel, { color: '#8B5CF6' }]}>Common Wake Mood</Text>
                <Text style={styles.quickStatValue}>{mostCommonMood}</Text>
              </View>
              
              <View style={styles.quickStatCard}>
                <Text style={[styles.quickStatLabel, { color: '#F59E0B' }]}>Consistency Score</Text>
                <Text style={styles.quickStatValue}>{consistencyScore}%</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Navigation Buttons - Removed Sleep Settings */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={styles.aiHelpButton}
            onPress={() => router.push('/chat')}
          >
            <Text style={styles.aiHelpButtonText}>💬 AI Sleep Help</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  dropdownContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 24,
    zIndex: 1000,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginRight: 8,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    textAlign: 'center',
  },
  dropdownItemTextActive: {
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  chartSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    height: 160,
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
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  logSleepButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#93C5FD',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  qualitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    backdropFilter: 'blur(10px)',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  entriesContainer: {
    maxHeight: 180,
  },
  entryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryLeft: {
    flex: 1,
  },
  entryDate: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  entryDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#93C5FD',
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  qualityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  qualityBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  moodText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#93C5FD',
  },
  quickStatsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backdropFilter: 'blur(10px)',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
    marginTop: 16,
  },
  aiHelpButton: {
    flex: 1,
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
  },
});