import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Plus, TrendingUp, Calendar, Edit, Trash2, X } from 'lucide-react-native';
import { moodService, ParsedMoodEntry, UpdateMoodEntryData } from '@/services/moodService';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedGestureHandler, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

export default function MoodTrackingScreen() {
  const [moodStats, setMoodStats] = useState({
    averageMood: 0,
    trend: 'stable' as 'improving' | 'declining' | 'stable',
    totalEntries: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<ParsedMoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ParsedMoodEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<UpdateMoodEntryData>({});

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      const [stats, entries] = await Promise.all([
        moodService.getMoodStatistics(),
        moodService.getUserMoodEntries(10)
      ]);
      
      setMoodStats({
        averageMood: stats.averageMood,
        trend: stats.weeklyTrend,
        totalEntries: stats.totalEntries,
      });
      
      setRecentEntries(entries);
      
      // Generate chart data for the last 7 days
      const chartPoints = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const moodEntry = entries.find(e => e.entry_date === dateStr);
        chartPoints.push({
          date: date,
          mood: moodEntry ? moodEntry.parsed.moodScore : null,
          energy: moodEntry ? moodEntry.parsed.energyLevel : null,
          calm: moodEntry ? (10 - moodEntry.parsed.anxietyLevel) : null,
          relaxed: moodEntry ? (10 - moodEntry.parsed.stressLevel) : null,
        });
      }
      setChartData(chartPoints);
      
    } catch (error) {
      console.error('Failed to load mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEntryModal = (entry: ParsedMoodEntry) => {
    setSelectedEntry(entry);
    setEditData({
      moodScore: entry.parsed.moodScore,
      energyLevel: entry.parsed.energyLevel,
      anxietyLevel: entry.parsed.anxietyLevel,
      stressLevel: entry.parsed.stressLevel,
      sleepQuality: entry.parsed.sleepQuality,
      emotions: entry.emotions,
      notes: entry.parsed.userNotes,
    });
    setShowModal(true);
    setEditMode(false);
  };

  const handleUpdateEntry = async () => {
    if (!selectedEntry) return;

    try {
      await moodService.updateMoodEntry(selectedEntry.id, editData);
      setShowModal(false);
      setEditMode(false);
      loadMoodData(); // Refresh data
      Alert.alert('Success', 'Mood entry updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update mood entry. Please try again.');
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this mood entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await moodService.deleteMoodEntry(selectedEntry.id);
              setShowModal(false);
              loadMoodData(); // Refresh data
              Alert.alert('Success', 'Mood entry deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete mood entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderSlider = (
    label: string,
    value: number,
    onValueChange: (value: number) => void,
    emoji: string,
    lowLabel: string,
    highLabel: string
  ) => {
    const translateX = useSharedValue((value / 10) * 250);

    const gestureHandler = useAnimatedGestureHandler({
      onStart: (_, context) => {
        context.startX = translateX.value;
      },
      onActive: (event, context) => {
        const newX = Math.max(0, Math.min(250, context.startX + event.translationX));
        translateX.value = newX;
        const newValue = Math.round((newX / 250) * 10);
        runOnJS(onValueChange)(Math.max(1, newValue));
      },
    });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    return (
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label} {emoji}</Text>
          <Text style={styles.sliderValue}>{value}/10</Text>
        </View>
        <View style={styles.sliderContainer}>
          <View style={styles.slider}>
            <View 
              style={[
                styles.sliderTrack,
                { width: `${(value / 10) * 100}%` }
              ]} 
            />
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.sliderThumb, animatedStyle]} />
            </PanGestureHandler>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>{lowLabel}</Text>
            <Text style={styles.sliderLabelText}>{highLabel}</Text>
          </View>
        </View>
      </View>
    );
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
          
          {/* Chart content */}
          <View style={styles.chartContent}>
            <View style={styles.chartGrid}>
              {[10, 7, 4, 1].map(value => (
                <View key={value} style={styles.gridLine} />
              ))}
            </View>
            
            {/* Data points and lines */}
            <View style={styles.dataContainer}>
              {chartData.map((point, index) => {
                if (index === 0) return null;
                
                const prevPoint = chartData[index - 1];
                const x1 = ((index - 1) / (chartData.length - 1)) * 100;
                const x2 = (index / (chartData.length - 1)) * 100;
                
                // Draw lines between points for each metric
                const metrics = [
                  { key: 'mood', color: '#3B82F6', prev: prevPoint.mood, curr: point.mood },
                  { key: 'energy', color: '#10B981', prev: prevPoint.energy, curr: point.energy },
                  { key: 'calm', color: '#F59E0B', prev: prevPoint.calm, curr: point.calm },
                  { key: 'relaxed', color: '#EF4444', prev: prevPoint.relaxed, curr: point.relaxed },
                ];

                return metrics.map(metric => {
                  if (metric.prev === null || metric.curr === null) return null;
                  
                  const y1 = ((maxValue - metric.prev) / maxValue) * 100;
                  const y2 = ((maxValue - metric.curr) / maxValue) * 100;
                  
                  return (
                    <View key={`${index}-${metric.key}`}>
                      {/* Previous point */}
                      <View 
                        style={[
                          styles.dataPoint,
                          { 
                            left: `${x1}%`,
                            top: `${y1}%`,
                            backgroundColor: metric.color
                          }
                        ]} 
                      />
                      {/* Current point */}
                      <View 
                        style={[
                          styles.dataPoint,
                          { 
                            left: `${x2}%`,
                            top: `${y2}%`,
                            backgroundColor: metric.color
                          }
                        ]} 
                      />
                    </View>
                  );
                }).filter(Boolean);
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
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.logButtonText}>Log Mood</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>😊</Text>
            <Text style={styles.statValue}>
              {loading ? '...' : `${moodStats.averageMood}/10`}
            </Text>
            <Text style={styles.statLabel}>Average Mood</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{getTrendIcon(moodStats.trend)}</Text>
            <Text style={styles.statValue}>
              {loading ? '...' : moodStats.trend.charAt(0).toUpperCase() + moodStats.trend.slice(1)}
            </Text>
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
            recentEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.recentEntry}
                onPress={() => openEntryModal(entry)}
              >
                <View style={styles.recentEntryContent}>
                  <Text style={styles.recentEntryDate}>
                    {new Date(entry.entry_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.recentEntryMood}>
                    {getMoodEmoji(entry.parsed.moodScore)}
                  </Text>
                </View>
                <Text style={styles.recentEntryDetails}>
                  Mood: {entry.parsed.moodScore}/10 • Energy: {entry.parsed.energyLevel}/10
                </Text>
              </TouchableOpacity>
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

      {/* Entry Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedEntry ? new Date(selectedEntry.entry_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }) : ''}
            </Text>
            <TouchableOpacity onPress={() => setEditMode(!editMode)}>
              <Edit size={24} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedEntry && (
              <>
                {editMode ? (
                  <View style={styles.editForm}>
                    {renderSlider(
                      'Mood',
                      editData.moodScore || 5,
                      (value) => setEditData(prev => ({ ...prev, moodScore: value })),
                      '😊',
                      'Very Low',
                      'Excellent'
                    )}
                    {renderSlider(
                      'Energy Level',
                      editData.energyLevel || 5,
                      (value) => setEditData(prev => ({ ...prev, energyLevel: value })),
                      '⚡',
                      'Exhausted',
                      'Energetic'
                    )}
                    {renderSlider(
                      'Anxiety Level',
                      editData.anxietyLevel || 5,
                      (value) => setEditData(prev => ({ ...prev, anxietyLevel: value })),
                      '😰',
                      'Calm',
                      'Very Anxious'
                    )}
                    {renderSlider(
                      'Stress Level',
                      editData.stressLevel || 5,
                      (value) => setEditData(prev => ({ ...prev, stressLevel: value })),
                      '😤',
                      'Relaxed',
                      'Very Stressed'
                    )}
                    {renderSlider(
                      'Sleep Quality',
                      editData.sleepQuality || 5,
                      (value) => setEditData(prev => ({ ...prev, sleepQuality: value })),
                      '😴',
                      'Poor',
                      'Excellent'
                    )}

                    <View style={styles.notesSection}>
                      <Text style={styles.notesLabel}>Notes</Text>
                      <TextInput
                        style={styles.notesInput}
                        value={editData.notes || ''}
                        onChangeText={(text) => setEditData(prev => ({ ...prev, notes: text }))}
                        placeholder="Add any additional notes..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={styles.cancelEditButton}
                        onPress={() => setEditMode(false)}
                      >
                        <Text style={styles.cancelEditButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveEditButton}
                        onPress={handleUpdateEntry}
                      >
                        <Text style={styles.saveEditButtonText}>Save Changes</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.viewMode}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricTitle}>Mood 😊</Text>
                      <Text style={styles.metricValue}>{selectedEntry.parsed.moodScore}/10</Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <Text style={styles.metricTitle}>Energy Level ⚡</Text>
                      <Text style={styles.metricValue}>{selectedEntry.parsed.energyLevel}/10</Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <Text style={styles.metricTitle}>Anxiety Level 😰</Text>
                      <Text style={styles.metricValue}>{selectedEntry.parsed.anxietyLevel}/10</Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <Text style={styles.metricTitle}>Stress Level 😤</Text>
                      <Text style={styles.metricValue}>{selectedEntry.parsed.stressLevel}/10</Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <Text style={styles.metricTitle}>Sleep Quality 😴</Text>
                      <Text style={styles.metricValue}>{selectedEntry.parsed.sleepQuality}/10</Text>
                    </View>

                    {selectedEntry.emotions.length > 0 && (
                      <View style={styles.emotionsCard}>
                        <Text style={styles.emotionsTitle}>Activities</Text>
                        <View style={styles.emotionsList}>
                          {selectedEntry.emotions.map((emotion, index) => (
                            <View key={index} style={styles.emotionTag}>
                              <Text style={styles.emotionText}>{emotion}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedEntry.parsed.userNotes && (
                      <View style={styles.notesCard}>
                        <Text style={styles.notesTitle}>Notes</Text>
                        <Text style={styles.notesText}>{selectedEntry.parsed.userNotes}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDeleteEntry}
                    >
                      <Trash2 size={20} color="#EF4444" />
                      <Text style={styles.deleteButtonText}>Delete Entry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentEntryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentEntryDate: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  recentEntryMood: {
    fontSize: 20,
  },
  recentEntryDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  viewMode: {
    paddingBottom: 40,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  metricValue: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  emotionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  emotionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 12,
  },
  emotionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionTag: {
    backgroundColor: '#8B5CF615',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emotionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    marginLeft: 8,
  },
  editForm: {
    paddingBottom: 40,
  },
  sliderSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  sliderValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  slider: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 12,
    width: 250,
  },
  sliderTrack: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#8B5CF6',
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
  sliderLabelText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  notesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelEditButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelEditButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  saveEditButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveEditButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});