import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, ChevronDown, Settings, Bot, TrendingUp, TrendingDown } from 'lucide-react-native';
import { sleepService, SleepAnalytics, SleepChartData } from '@/services/sleepService';

interface SleepInsightsData {
  chartData: SleepChartData[];
  averageDuration: number;
  sleepScore: number;
  trend: 'up' | 'down' | 'stable';
  qualityBreakdown: {
    deep: number;
    light: number;
    awake: number;
  };
  recentEntries: any[];
}

export default function SleepInsightsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Last Week');
  const [selectedDate, setSelectedDate] = useState('Aug 6');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [insightsData, setInsightsData] = useState<SleepInsightsData>({
    chartData: [],
    averageDuration: 0,
    sleepScore: 0,
    trend: 'stable',
    qualityBreakdown: { deep: 0, light: 0, awake: 0 },
    recentEntries: [],
  });
  const [loading, setLoading] = useState(true);

  const periods = ['Last Week', 'Last Month', 'Last 3 Months'];
  const dates = ['Aug 4', 'Aug 5', 'Aug 6'];

  useEffect(() => {
    loadSleepInsights();
  }, [selectedPeriod]);

  const loadSleepInsights = async () => {
    try {
      setLoading(true);
      
      // Determine days based on selected period
      const days = selectedPeriod === 'Last Week' ? 7 : 
                   selectedPeriod === 'Last Month' ? 30 : 90;

      const [analytics, chartData, recentEntries] = await Promise.all([
        sleepService.getSleepAnalytics(days),
        sleepService.getChartData(days),
        sleepService.getUserSleepEntries(5)
      ]);

      // Calculate sleep score (0-100)
      const sleepScore = Math.round(
        (analytics.qualityAverage / 10) * 40 + // 40% weight for quality
        (Math.min(analytics.weeklyAverage / 8, 1)) * 35 + // 35% weight for duration
        (analytics.consistency / 100) * 25 // 25% weight for consistency
      );

      // Calculate trend
      const recentAvg = chartData.slice(-3).reduce((sum, d) => sum + (d.duration || 0), 0) / 3;
      const earlierAvg = chartData.slice(0, 3).reduce((sum, d) => sum + (d.duration || 0), 0) / 3;
      const trend = recentAvg > earlierAvg + 0.5 ? 'up' : 
                   recentAvg < earlierAvg - 0.5 ? 'down' : 'stable';

      // Generate quality breakdown (estimated from available data)
      const qualityBreakdown = generateQualityBreakdown(analytics.qualityAverage);

      setInsightsData({
        chartData,
        averageDuration: analytics.weeklyAverage,
        sleepScore,
        trend,
        qualityBreakdown,
        recentEntries,
      });
    } catch (error) {
      console.error('Failed to load sleep insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQualityBreakdown = (avgQuality: number) => {
    // Estimate sleep stage percentages based on quality score
    const baseDeep = 20; // Base deep sleep percentage
    const baseLight = 65; // Base light sleep percentage
    const baseAwake = 15; // Base awake percentage

    // Adjust based on quality (higher quality = more deep sleep, less awake time)
    const qualityFactor = (avgQuality - 5) / 5; // -1 to 1 range
    
    const deep = Math.max(15, Math.min(35, baseDeep + (qualityFactor * 10)));
    const awake = Math.max(5, Math.min(25, baseAwake - (qualityFactor * 8)));
    const light = 100 - deep - awake;

    return {
      deep: Math.round(deep),
      light: Math.round(light),
      awake: Math.round(awake),
    };
  };

  const renderSleepChart = () => {
    const maxDuration = Math.max(...insightsData.chartData.map(d => d.duration || 0), 10);
    const chartHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[Math.round(maxDuration), Math.round(maxDuration * 0.75), Math.round(maxDuration * 0.5), Math.round(maxDuration * 0.25)].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value}h</Text>
            ))}
          </View>
          
          {/* Chart content */}
          <View style={styles.chartContent}>
            {/* Grid lines */}
            <View style={styles.chartGrid}>
              {[0, 25, 50, 75].map(value => (
                <View key={value} style={styles.gridLine} />
              ))}
            </View>
            
            {/* Data line and points */}
            <View style={styles.dataContainer}>
              {insightsData.chartData.map((point, index) => {
                if (!point.duration) return null;
                
                const x = (index / (insightsData.chartData.length - 1)) * 100;
                const y = ((maxDuration - point.duration) / maxDuration) * 100;
                
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
                        const y2 = ((maxDuration - nextPoint.duration) / maxDuration) * 100;
                        
                        const lineLength = Math.sqrt(
                          Math.pow((x2 - x) * 2.5, 2) + 
                          Math.pow((y2 - y) * 1.2, 2)
                        );
                        const angle = Math.atan2((y2 - y) * 1.2, (x2 - x) * 2.5) * 180 / Math.PI;
                        
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
          {insightsData.chartData.slice(-7).map((point, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderQualityDonut = () => {
    const { deep, light, awake } = insightsData.qualityBreakdown;
    const total = deep + light + awake;
    
    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutChart}>
          {/* Simplified donut representation */}
          <View style={styles.donutCenter}>
            <Text style={styles.donutCenterText}>Sleep</Text>
            <Text style={styles.donutCenterText}>Quality</Text>
          </View>
        </View>
        
        <View style={styles.donutLegend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendLabel}>Deep</Text>
            <Text style={styles.legendValue}>{deep}%</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendLabel}>Light</Text>
            <Text style={styles.legendValue}>{light}%</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendLabel}>Awake</Text>
            <Text style={styles.legendValue}>{awake}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentEntries = () => {
    return (
      <View style={styles.recentEntriesContainer}>
        {insightsData.recentEntries.slice(0, 3).map((entry, index) => {
          const quality = entry.sleep_quality;
          const qualityColor = quality >= 7 ? '#10B981' : quality >= 5 ? '#F59E0B' : '#EF4444';
          
          return (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryDate}>
                <Text style={styles.entryDayText}>
                  {new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={styles.entryDateText}>
                  {new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              
              <View style={styles.entryDuration}>
                <Text style={styles.entryDurationText}>
                  {sleepService.formatDuration(entry.sleep_duration)}
                </Text>
              </View>
              
              <View style={styles.entryQuality}>
                <View style={[styles.qualityDot, { backgroundColor: qualityColor }]} />
                <View style={[styles.qualityDot, { backgroundColor: quality >= 6 ? qualityColor : '#374151' }]} />
                <View style={[styles.qualityDot, { backgroundColor: quality >= 8 ? qualityColor : '#374151' }]} />
              </View>
              
              <View style={styles.entryPattern}>
                <View style={styles.sleepBar}>
                  <View style={[styles.sleepSegment, { backgroundColor: '#10B981', flex: 0.25 }]} />
                  <View style={[styles.sleepSegment, { backgroundColor: '#F59E0B', flex: 0.6 }]} />
                  <View style={[styles.sleepSegment, { backgroundColor: '#EF4444', flex: 0.15 }]} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1f36', '#2d3748']}
        style={styles.header}
      >
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
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateTab,
                selectedDate === date && styles.dateTabActive
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateTabText,
                selectedDate === date && styles.dateTabTextActive
              ]}>
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sleep Duration Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Sleep Duration</Text>
          {renderSleepChart()}
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {loading ? '...' : sleepService.formatDuration(insightsData.averageDuration)}
            </Text>
            <View style={styles.metricTrendRow}>
              <Text style={styles.metricLabel}>Average</Text>
              {insightsData.trend === 'up' && <TrendingUp size={12} color="#10B981" />}
              {insightsData.trend === 'down' && <TrendingDown size={12} color="#EF4444" />}
            </View>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {loading ? '...' : `${insightsData.sleepScore}/100`}
            </Text>
            <Text style={styles.metricLabel}>Sleep Score</Text>
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
          {renderRecentEntries()}
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
  },
  dateNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  dateTab: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dateTabActive: {
    backgroundColor: '#8B5CF6',
  },
  dateTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  dateTabTextActive: {
    color: '#FFFFFF',
  },
  chartSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
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
    paddingLeft: 30,
  },
  xAxisLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  qualitySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  donutContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
    // Simplified donut - in production you'd use a proper chart library
  },
  donutCenter: {
    position: 'absolute',
    top: 35,
    left: 35,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1f36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  donutLegend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 12,
  },
  legendValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  recentEntriesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  entryDate: {
    width: 60,
  },
  entryDayText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  entryDateText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  entryDuration: {
    flex: 1,
    marginLeft: 16,
  },
  entryDurationText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  entryQuality: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: 16,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryPattern: {
    width: 60,
  },
  sleepBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sleepSegment: {
    height: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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