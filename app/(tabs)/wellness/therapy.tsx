import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Phone, Globe, MessageCircle, MapPin, Heart } from 'lucide-react-native';

export default function TherapyScreen() {
  const emergencyResources = [
    {
      title: 'Suicide Prevention Hotline',
      number: '042 3576 5951',
      description: '24/7 crisis support',
      urgent: true,
    },
    {
      title: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Free 24/7 crisis counseling',
      urgent: true,
    },
  ];

  const professionalResources = [
    {
      title: 'MARHAM.PK',
      description: 'Find psychologists in Pakistan',
      action: 'Visit Website',
      url: 'https://www.marham.pk/doctors/karachi/psychologist',
      icon: Globe,
    },
    {
      title: 'BetterHelp',
      description: 'Online therapy platform',
      action: 'Learn More',
      url: 'https://www.betterhelp.com',
      icon: MessageCircle,
    },
    {
      title: 'TASKEEN National Helpline',
      description: 'Mental health support service',
      action: 'Call 0316 8275336',
      phone: '03168275336',
      icon: Phone,
    },
  ];

  const selfCareResources = [
    'Practice deep breathing exercises',
    'Maintain a regular sleep schedule',
    'Stay connected with supportive friends and family',
    'Engage in physical activity',
    'Limit alcohol and avoid drugs',
    'Consider mindfulness and meditation',
  ];

  const handleEmergencyCall = (number: string) => {
    const phoneNumber = number.replace(/\D/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleResourceAction = (resource: any) => {
    if (resource.phone) {
      Linking.openURL(`tel:${resource.phone}`);
    } else if (resource.url) {
      Linking.openURL(resource.url);
    }
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
        <Text style={styles.title}>Support Resources</Text>
        <Text style={styles.subtitle}>Professional help and guidance</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>Emergency Support</Text>
          <Text style={styles.emergencyWarning}>
            If you're having thoughts of self-harm or suicide, please reach out immediately:
          </Text>
          
          {emergencyResources.map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emergencyCard}
              onPress={() => handleEmergencyCall(resource.number)}
            >
              <View style={styles.emergencyContent}>
                <Text style={styles.emergencyTitle}>{resource.title}</Text>
                <Text style={styles.emergencyNumber}>{resource.number}</Text>
                <Text style={styles.emergencyDescription}>{resource.description}</Text>
              </View>
              <Phone size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Resources</Text>
          
          {professionalResources.map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resourceCard}
              onPress={() => handleResourceAction(resource)}
            >
              <View style={styles.resourceIcon}>
                <resource.icon size={24} color="#8B5CF6" />
              </View>
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceDescription}>{resource.description}</Text>
                <Text style={styles.resourceAction}>{resource.action}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Self-Care Strategies</Text>
          <View style={styles.selfCareCard}>
            <Heart size={24} color="#EF4444" style={styles.selfCareIcon} />
            <Text style={styles.selfCareTitle}>Daily Wellness Practices</Text>
            {selfCareResources.map((tip, index) => (
              <Text key={index} style={styles.selfCareTip}>• {tip}</Text>
            ))}
          </View>
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Important Notice</Text>
          <Text style={styles.disclaimerText}>
            This app is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of qualified health providers with any questions you may have 
            regarding a medical condition.
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emergencySection: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  emergencyWarning: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7C2D12',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    lineHeight: 20,
  },
  emergencyCard: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emergencyNumber: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  resourceCard: {
    flexDirection: 'row',
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
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF615',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  resourceAction: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  selfCareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  selfCareIcon: {
    marginBottom: 12,
  },
  selfCareTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  selfCareTip: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  disclaimerCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 20,
  },
});