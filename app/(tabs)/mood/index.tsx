import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BookOpen, Camera, TrendingUp, Calendar } from 'lucide-react-native';

export default function MoodScreen() {
  const moodFeatures = [
    {
      title: 'Daily Journal',
      description: 'Reflect on your thoughts and feelings',
      icon: BookOpen,
      color: '#F59E0B',
      route: '/mood/journal',
    },
    // {
    //   title: 'Sentiment Analysis',
    //   description: 'Analyze your mood through photos',
    //   icon: Camera,
    //   color: '#10B981',
    //   route: '/mood/sentiment',
    // },
    {
      title: 'Mood Tracking',
      description: 'Visual mood calendar and trends',
      icon: TrendingUp,
      color: '#3B82F6',
      route: '/mood/tracking',
    },
  ];

  return (
    <LinearGradient
      colors={['#E6F3FF', '#F3E8FF']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mood Center</Text>
          <Text style={styles.subtitle}>Track and understand your emotions</Text>
        </View>

        {/* Quick Mood Check - Temporarily Disabled */}
        {/* <View style={styles.quickMoodCheck}>
          <Text style={styles.quickTitle}>Quick Mood Check</Text>
          <Text style={styles.quickSubtitle}>How are you feeling right now?</Text>
          <View style={styles.moodButtons}>
            {['😢', '😟', '😐', '🙂', '😊'].map((emoji, index) => (
              <TouchableOpacity key={index} style={styles.moodButton}>
                <Text style={styles.moodEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View> */}

        <View style={styles.featuresContainer}>
          {moodFeatures.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.enhancedFeatureCard}
              onPress={() => router.push(feature.route as any)}
            >
              <View style={[styles.enhancedFeatureIcon, { backgroundColor: `${feature.color}15` }]}>
                <feature.icon size={32} color={feature.color} />
              </View>
              <View style={styles.enhancedFeatureContent}>
                <Text style={styles.enhancedFeatureTitle}>{feature.title}</Text>
                <Text style={styles.enhancedFeatureDescription}>{feature.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  quickMoodCheck: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  quickTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 24,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  enhancedFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  enhancedFeatureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedFeatureContent: {
    flex: 1,
  },
  enhancedFeatureTitle: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  enhancedFeatureDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  // Keep original styles for backward compatibility
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});