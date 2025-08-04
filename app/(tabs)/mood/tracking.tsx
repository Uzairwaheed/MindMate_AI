import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Plus, TrendingUp, Calendar } from 'lucide-react-native';
import { moodService } from '@/services/moodService';

export default function MoodTrackingScreen() {
  const [moodStats, setMoodStats] = useState({
    averageMood: 7.2,
    trend: 'Stable',
    totalEntries: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      const stats = await moodService.getMoodStatistics();
      const trends = await moodService.getMoodTrends(7);
      
      setMoodStats({
        averageMood: stats.averageMood,
        trend: stats.averageMood >= 7 ? 'Stable' : stats.averageMood >= 5 ? 'Improving' : 'Declining',
        totalEntries: stats.totalEntries,
      });
      
      // Generate chart data for the last 7 days
      const chartPoints = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const moodEntry = trends.find(t => t.date === dateStr);
        chartPoints.push({
          date: date,
          mood: moodEntry?.score || Math.random() * 3 + 6, // Fallback to random data
          energy: Math.random() * 3 + 6,
          calm: Math.random() * 3 + 6,
          relaxed: Math.random() * 3 + 6,
        });
      }
      setChartData(chartPoints);
      
    } catch (error) {
      console.error('Failed to load mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    const maxValue = 10;
    const chartHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[10, 7, 4, 1].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value}</Text>
            ))}
          </View>
          
          {/* Chart lines */}
          <View style={styles.chartContent}>
            <View style={styles.chartGrid}>
              {[10, 7, 4, 1].map(value => (
                <View key={value} style={styles.gridLine} />
              ))}
            </View>
            
            {/* Data points and lines */}
            <View style={styles.dataContainer}>
              {chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 100;
                const moodY = ((maxValue - point.mood) / maxValue) * 100;
                const energyY = ((maxValue - point.energy) / maxValue) * 100;
                const calmY = ((maxValue - point.calm) / maxValue) * 100;
                const relaxedY = ((maxValue - point.relaxed) / maxValue) * 100;
                
                return (
                  <View key={index}>
                    {/* Mood line (blue) */}
                    <View 
                      style={[
                        styles.dataPoint,
                        { 
                          left: `${x}%`,
                          top: `${moodY}%`,
                          backgroundColor: '#3B82F6'
                        }
                      ]} 
                    />
                    {/* Energy line (green) */}
                    <View 
                      style={[
                        styles.dataPoint,
                        { 
                          left: `${x}%`,
                          top: `${energyY}%`,
                          backgroundColor: '#10B981'
                        }
                      ]} 
                    />
                    {/* Calm line (orange) */}
                    <View 
                      style={[
                        styles.dataPoint,
                        { 
                          left: `${x}%`,
                          top: `${calmY}%`,
                          backgroundColor: '#F59E0B'
                        }
                      ]} 
                    />
                    {/* Relaxed line (red) */}
                    <View 
                      style={[
                        styles.dataPoint,
                        { 
                          left: `${x}%`,
                          top: `${relaxedY}%`,
                          backgroundColor: '#EF4444'
                        }
                      ]} 
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {chartData.map((point, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          ))}
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Mood</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Energy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Calm</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Relaxed</Text>
          </View>
        </View>
      </View>
    );
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
          <Text style={styles.title}>Mood Tracking</Text>
          <Text style={styles.subtitle}>Monitor your emotional patterns</Text>
        </View>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => router.push('/mood/log')}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.logButtonText}>Log Mood</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>😊</Text>
            <Text style={styles.statValue}>{moodStats.averageMood}/10</Text>
            <Text style={styles.statLabel}>Average Mood</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.statValue}>{moodStats.trend}</Text>
            <Text style={styles.statLabel}>7-Day Trend</Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>7-Day Mood Trends</Text>
          {renderChart()}
        </View>

        {/* Recent Entries */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.recentTitle}>Recent Entries</Text>
          </View>
          
          {recentEntries.length > 0 ? (
            recentEntries.map((entry, index) => (
              <View key={entry.id} style={styles.recentEntry}>
                <Text style={styles.recentEntryDate}>{entry.date}</Text>
                <Text style={styles.recentEntryMood}>{entry.mood}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No mood entries yet</Text>
              <TouchableOpacity
                style={styles.firstEntryButton}
                onPress={() => router.push('/mood/log')}
              >
                <Text style={styles.firstEntryButtonText}>Log Your First Mood Entry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F3FF',
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
  logButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  chartSection: {
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
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
  },
  chartContainer: {
    height: 200,
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
    backgroundColor: '#F3F4F6',
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 28,
    marginBottom: 16,
  },
  xAxisLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  recentSection: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentEntryDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  recentEntryMood: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 20,
  },
  firstEntryButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  firstEntryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});