import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Clock, TrendingUp, Settings, Plus } from 'lucide-react-native';

export default function SleepScreen() {
  const [sleepData] = useState({
    lastNight: '7h 32m',
    average: '7h 15m',
    quality: 'Good',
    bedtime: '10:30 PM',
    wakeTime: '6:00 AM'
  });

  const weeklyData = [
    { day: 'Mon', hours: 7.5 },
    { day: 'Tue', hours: 6.8 },
    { day: 'Wed', hours: 8.2 },
    { day: 'Thu', hours: 7.1 },
    { day: 'Fri', hours: 6.5 },
    { day: 'Sat', hours: 8.8 },
    { day: 'Sun', hours: 7.9 },
  ];

  return (
    <LinearGradient
      colors={['#1F2937', '#374151', '#4B5563']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Moon size={32} color="#E5E7EB" />
          <Text style={styles.title}>Sleep Tracker</Text>
          <Text style={styles.subtitle}>Monitor your sleep patterns</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Last Night</Text>
          <Text style={styles.sleepDuration}>{sleepData.lastNight}</Text>
          <Text style={styles.sleepQuality}>Sleep Quality: {sleepData.quality}</Text>
          
          <View style={styles.timeContainer}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Bedtime</Text>
              <Text style={styles.timeValue}>{sleepData.bedtime}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Wake Time</Text>
              <Text style={styles.timeValue}>{sleepData.wakeTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.weeklyCard}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.chartContainer}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View 
                  style={[
                    styles.bar, 
                    { height: (day.hours / 10) * 100 }
                  ]} 
                />
                <Text style={styles.dayLabel}>{day.day}</Text>
                <Text style={styles.hoursLabel}>{day.hours}h</Text>
              </View>
            ))}
          </View>
          <Text style={styles.averageText}>
            Average: {sleepData.average}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Plus size={24} color="#E5E7EB" />
            <Text style={styles.actionButtonText}>Log Sleep</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <TrendingUp size={24} color="#E5E7EB" />
            <Text style={styles.actionButtonText}>View Trends</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Settings size={24} color="#E5E7EB" />
            <Text style={styles.actionButtonText}>Sleep Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Sleep Tips</Text>
          <Text style={styles.tipText}>• Maintain a consistent sleep schedule</Text>
          <Text style={styles.tipText}>• Create a relaxing bedtime routine</Text>
          <Text style={styles.tipText}>• Avoid screens 1 hour before bed</Text>
          <Text style={styles.tipText}>• Keep your bedroom cool and dark</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  sleepDuration: {
    fontSize: 36,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  sleepQuality: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
  },
  weeklyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 20,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  hoursLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
  },
  averageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#E5E7EB',
    marginTop: 8,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 20,
    marginBottom: 4,
  },
});