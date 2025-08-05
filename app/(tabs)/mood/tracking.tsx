import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Plus, TrendingUp, Calendar, CreditCard as Edit, Trash2, X, Check, BookOpen } from 'lucide-react-native';
import { moodService, ParsedMoodEntry, UpdateMoodEntryData } from '@/services/moodService';

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
      const [stats, chartData, entries] = await Promise.all([
        moodService.getMoodAnalytics(),
        moodService.getChartData(7),
        moodService.getUserMoodEntries(5)
      ]);
      
      setMoodStats({
        averageMood: stats.averageMood,
        trend: stats.weeklyTrend,
        totalEntries: stats.totalEntries,
      });
      
      setRecentEntries(entries);
      setChartData(chartData);
      
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
      await loadMoodData(); // Refresh data
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
              await loadMoodData(); // Refresh data
              Alert.alert('Success', 'Mood entry deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete mood entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderChart = () => {
    const maxValue = 10;
    const chartHeight = 120;
    const chartWidth = 280;
    
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
            {/* Grid lines */}
            <View style={styles.chartGrid}>
              {[10, 7, 4, 1].map(value => (
                <View key={value} style={styles.gridLine} />
              ))}
            </View>
            
            {/* Data points and lines */}
            <View style={styles.dataContainer}>
              {chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 100;
                
                // Render data points for each metric
                const metrics = [
                  { key: 'mood', color: '#3B82F6', value: point.mood },
                  { key: 'energy', color: '#10B981', value: point.energy },
                  { key: 'calm', color: '#F59E0B', value: point.calm },
                  { key: 'relaxed', color: '#EF4444', value: point.relaxed },
                ];

                return metrics.map(metric => {
                  if (metric.value === null) return null;
                  
                  const y = ((maxValue - metric.value) / maxValue) * 100;
                  
                  return (
                    <View key={`${index}-${metric.key}`}>
                      <View 
                        style={[
                          styles.dataPoint,
                          { 
                            left: `${x}%`,
                            top: `${y}%`,
                            backgroundColor: metric.color
                          }
                        ]} 
                      />
                      {/* Draw line to next point */}
                      {index < chartData.length - 1 && (
                        (() => {
                          const nextPoint = chartData[index + 1];
                          const nextMetric = nextPoint[metric.key === 'mood' ? 'mood' : 
                                                     metric.key === 'energy' ? 'energy' :
                                                     metric.key === 'calm' ? 'calm' : 'relaxed'];
                          
                          if (nextMetric === null) return null;
                          
                          const x2 = ((index + 1) / (chartData.length - 1)) * 100;
                          const y2 = ((maxValue - nextMetric) / maxValue) * 100;
                          
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
                                  backgroundColor: metric.color,
                                  transform: [{ rotate: `${angle}deg` }],
                                }
                              ]}
                            />
                          );
                        })()
                      )}
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
              {point.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
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

  const renderSlider = (
    label: string,
    value: number,
    onValueChange: (value: number) => void,
    emoji: string,
    lowLabel: string,
    highLabel: string,
    color: string = '#8B5CF6'
  ) => (
    <View style={styles.editSliderSection}>
      <View style={styles.editSliderHeader}>
        <Text style={styles.editSliderLabel}>{label} {emoji}</Text>
        <Text style={[styles.editSliderValue, { color }]}>{value}/10</Text>
      </View>
      <View style={styles.editSliderContainer}>
        <View style={styles.editSlider}>
          <View 
            style={[
              styles.editSliderTrack,
              { width: `${(value / 10) * 100}%`, backgroundColor: color }
            ]} 
          />
          <TouchableOpacity
            style={[
              styles.editSliderThumb,
              { left: `${(value / 10) * 100 - 2}%`, backgroundColor: color }
            ]}
            onPressIn={(e) => {
              // Simple touch-based slider
          <TouchableOpacity
            style={styles.journalButton}
            onPress={() => router.push('/mood/journal')}
          >
            <BookOpen size={16} color="#8B5CF6" />
            <Text style={styles.journalButtonText}>Journal</Text>
          </TouchableOpacity>
              const { locationX } = e.nativeEvent;
              const newValue = Math.round((locationX / 250) * 10);
              onValueChange(Math.max(1, Math.min(10, newValue)));
            }}
          />
        </View>
        <View style={styles.editSliderLabels}>
          <Text style={styles.editSliderLabelText}>{lowLabel}</Text>
          <Text style={styles.editSliderLabelText}>{highLabel}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#8B5CF6" />
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
              {loading ? '...' : (moodStats.trend || 'stable').charAt(0).toUpperCase() + (moodStats.trend || 'stable').slice(1)}
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
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.recentEntryMood}>
                    {getMoodEmoji(entry.parsed.moodScore)}
                  </Text>
                </View>
                <Text style={styles.recentEntryDetails}>
                  Mood: {entry.parsed.moodScore}/10 • Energy: {entry.parsed.energyLevel}/10 • Anxiety: {entry.parsed.anxietyLevel}/10
                </Text>
                {entry.parsed.userNotes && (
                  <Text style={styles.recentEntryNotes} numberOfLines={1}>
                    "{entry.parsed.userNotes}"
                  </Text>
                )}
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
                      'Excellent',
                      '#8B5CF6'
                    )}
                    {renderSlider(
                      'Energy Level',
                      editData.energyLevel || 5,
                      (value) => setEditData(prev => ({ ...prev, energyLevel: value })),
                      '⚡',
                      'Exhausted',
                      'Energetic',
                      '#10B981'
                    )}
                    {renderSlider(
                      'Anxiety Level',
                      editData.anxietyLevel || 5,
                      (value) => setEditData(prev => ({ ...prev, anxietyLevel: value })),
                      '😰',
                      'Calm',
                      'Very Anxious',
                      '#F59E0B'
                    )}
                    {renderSlider(
                      'Stress Level',
                      editData.stressLevel || 5,
                      (value) => setEditData(prev => ({ ...prev, stressLevel: value })),
                      '😤',
                      'Relaxed',
                      'Very Stressed',
                      '#EF4444'
                    )}
                    {renderSlider(
                      'Sleep Quality',
                      editData.sleepQuality || 5,
                      (value) => setEditData(prev => ({ ...prev, sleepQuality: value })),
                      '😴',
                      'Poor',
                      'Excellent',
                      '#6366F1'
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
  journalButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  journalButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
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
  chartLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
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
    marginBottom: 4,
  },
  recentEntryNotes: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
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
  editSliderSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  editSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editSliderLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  editSliderValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  editSliderContainer: {
    paddingHorizontal: 4,
  },
  editSlider: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 12,
    width: 250,
  },
  editSliderTrack: {
    height: '100%',
    borderRadius: 3,
  },
  editSliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editSliderLabelText: {
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