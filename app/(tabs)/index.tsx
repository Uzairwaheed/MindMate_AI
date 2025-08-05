import React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  MessageCircle, 
  Camera, 
  BookOpen, 
  Settings, 
  TrendingUp,
  Heart,
  Brain,
  Moon
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { journalService } from '@/services/journalService';
import { moodService } from '@/services/moodService';

export default function DashboardScreen() {
  const { user, greeting } = useAuthStore();
  const [moodData, setMoodData] = useState({
    weeklyAverage: 0,
    trend: 0,
    totalEntries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const analytics = await journalService.getMoodAnalytics();
      const moodAnalytics = await moodService.getMoodAnalytics();
      setMoodData({
        weeklyAverage: moodAnalytics.averageMood,
        trend: moodAnalytics.weeklyTrend === 'improving' ? 1 : moodAnalytics.weeklyTrend === 'declining' ? -1 : 0,
        totalEntries: moodAnalytics.totalEntries,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'AI Chatbot',
      description: 'Talk to your mental health companion',
      icon: MessageCircle,
      color: '#3B82F6',
      route: '/chat',
    },
    {
      title: 'Mood Check-in',
      description: 'Track your daily emotional state',
      icon: Heart,
      color: '#EF4444',
      route: '/mood',
    },
    {
      title: 'Sentiment Analysis',
      description: 'Analyze your mood through photos',
      icon: Camera,
      color: '#10B981',
      route: '/mood/sentiment',
    },
    {
      title: 'Wellness Quiz',
      description: 'Assess your mental health',
      icon: Brain,
      color: '#8B5CF6',
      route: '/wellness/quiz',
    },
    {
      title: 'Daily Journal',
      description: 'Reflect on your thoughts',
      icon: BookOpen,
      color: '#F59E0B',
      route: '/mood/journal',
    },
    {
      title: 'Sleep Tracker',
      description: 'Monitor your sleep patterns',
      icon: Moon,
      color: '#6366F1',
      route: '/sleep',
    },
  ];

  return (
    <LinearGradient
      colors={['#E6F3FF', '#F3E8FF', '#FAFAFA']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}, {user?.fullName?.split(' ')[0] || 'there'}!</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>

        <View style={styles.moodSummary}>
          <LinearGradient
            colors={['#8B5CF6', '#3B82F6']}
            style={styles.moodCard}
          >
            <Text style={styles.moodTitle}>This Week's Mood</Text>
            <View style={styles.moodScoreContainer}>
              <Text style={styles.moodScore}>
                {loading ? '...' : `${moodData.weeklyAverage}/10`}
              </Text>
              <View style={styles.trendContainer}>
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.trendText}>
                  {loading ? '...' : `${moodData.trend >= 0 ? '+' : ''}${moodData.trend}`}
                </Text>
              </View>
            </View>
            <Text style={styles.moodDescription}>
              {loading 
                ? 'Loading your mood data...' 
                : moodData.weeklyAverage >= 8 
                  ? "You're doing great! Keep up the positive momentum."
                  : moodData.weeklyAverage >= 6
                    ? "You're managing well. Consider some self-care activities."
                    : "Take care of yourself. Consider reaching out for support."
              }
            </Text>
            <Text style={styles.moodEmoji}>
              {loading ? '😐' : 
               moodData.weeklyAverage >= 8 ? '😊' :
               moodData.weeklyAverage >= 6 ? '🙂' :
               moodData.weeklyAverage <= 3 ? '😞' : '😐'}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Explore Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featureCard}
                onPress={() => router.push(feature.route as any)}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                  <feature.icon size={24} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Settings size={20} color="#6B7280" />
          <Text style={styles.settingsText}>Settings & Notifications</Text>
        </TouchableOpacity>
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
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
  },
  moodSummary: {
    marginBottom: 32,
  },
  moodCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  moodTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  moodScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodScore: {
    fontSize: 36,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trendText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  moodDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  moodEmoji: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginLeft: 12,
  },
});