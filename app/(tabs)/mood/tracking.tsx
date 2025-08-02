import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Calendar, TrendingUp } from 'lucide-react-native';

export default function MoodTrackingScreen() {
  const [selectedView, setSelectedView] = useState<'calendar' | 'chart'>('calendar');
  
  // Sample mood data for the last 30 days
  const moodData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    mood: Math.floor(Math.random() * 5) + 1, // 1-5 scale
  }));

  const getMoodColor = (mood: number) => {
    const colors = ['#EF4444', '#F59E0B', '#6B7280', '#3B82F6', '#10B981'];
    return colors[mood - 1];
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😟', '😐', '🙂', '😊'];
    return emojis[mood - 1];
  };

  const renderCalendarView = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDayOfMonth || days.length < 42) {
      const dayData = moodData.find(d => 
        d.date.toDateString() === currentDate.toDateString()
      );
      
      days.push({
        date: new Date(currentDate),
        mood: dayData?.mood,
        isCurrentMonth: currentDate.getMonth() === today.getMonth(),
        isToday: currentDate.toDateString() === today.toDateString(),
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={styles.monthYear}>
            {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        
        <View style={styles.weekdaysHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayCell,
                  !day.isCurrentMonth && styles.dayOtherMonth,
                  day.isToday && styles.dayToday,
                ]}
              >
                <Text style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.dayNumberOtherMonth,
                  day.isToday && styles.dayNumberToday,
                ]}>
                  {day.date.getDate()}
                </Text>
                {day.mood && (
                  <View 
                    style={[
                      styles.moodIndicator, 
                      { backgroundColor: getMoodColor(day.mood) }
                    ]} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderChartView = () => {
    const recentData = moodData.slice(-14); // Last 14 days
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Mood Trends (Last 2 Weeks)</Text>
        <View style={styles.chart}>
          {recentData.map((data, index) => (
            <View key={index} style={styles.chartColumn}>
              <View 
                style={[
                  styles.chartBar,
                  { 
                    height: (data.mood / 5) * 100,
                    backgroundColor: getMoodColor(data.mood)
                  }
                ]} 
              />
              <Text style={styles.chartDate}>
                {data.date.getDate()}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={styles.moodLegend}>
          {[1, 2, 3, 4, 5].map(mood => (
            <View key={mood} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: getMoodColor(mood) }
                ]} 
              />
              <Text style={styles.legendText}>{getMoodEmoji(mood)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#E6F3FF', '#F3E8FF']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.title}>Mood Tracking</Text>
        <Text style={styles.subtitle}>Visualize your emotional patterns</Text>
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === 'calendar' && styles.toggleButtonActive]}
          onPress={() => setSelectedView('calendar')}
        >
          <Calendar size={20} color={selectedView === 'calendar' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[
            styles.toggleText,
            selectedView === 'calendar' && styles.toggleTextActive
          ]}>
            Calendar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toggleButton, selectedView === 'chart' && styles.toggleButtonActive]}
          onPress={() => setSelectedView('chart')}
        >
          <TrendingUp size={20} color={selectedView === 'chart' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[
            styles.toggleText,
            selectedView === 'chart' && styles.toggleTextActive
          ]}>
            Trends
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedView === 'calendar' ? renderCalendarView() : renderChartView()}
        
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Insights</Text>
          <Text style={styles.insightText}>
            • Your mood tends to be highest on weekends
          </Text>
          <Text style={styles.insightText}>
            • You've had 3 consecutive good days this week
          </Text>
          <Text style={styles.insightText}>
            • Your average mood this month is 3.8/5
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
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 6,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  weekdaysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayOtherMonth: {
    opacity: 0.3,
  },
  dayToday: {
    backgroundColor: '#8B5CF615',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  dayNumberOtherMonth: {
    color: '#9CA3AF',
  },
  dayNumberToday: {
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  moodIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 20,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBar: {
    width: 16,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 20,
  },
  chartDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  moodLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 16,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  insightsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
});