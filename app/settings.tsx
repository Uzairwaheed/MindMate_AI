import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Bell, Clock, User, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

export default function SettingsScreen() {
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('8:00 PM');
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          title: 'Daily Mood Reminder',
          subtitle: 'Get reminded to check in with yourself',
          type: 'toggle',
          value: dailyReminder,
          onToggle: setDailyReminder,
          icon: Bell,
        },
        {
          title: 'Reminder Time',
          subtitle: reminderTime,
          type: 'time',
          icon: Clock,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Profile Settings',
          subtitle: 'Edit your personal information',
          type: 'navigation',
          icon: User,
          onPress: () => {},
        },
        {
          title: 'Privacy & Security',
          subtitle: 'Manage your data and privacy',
          type: 'navigation',
          icon: Shield,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Help & FAQ',
          subtitle: 'Get answers to common questions',
          type: 'navigation',
          icon: HelpCircle,
          onPress: () => {},
        },
        {
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          type: 'action',
          icon: LogOut,
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

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
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.settingItemLast
                  ]}
                  onPress={item.onPress}
                  disabled={item.type === 'toggle'}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={[
                      styles.settingIcon,
                      item.danger && styles.settingIconDanger
                    ]}>
                      <item.icon 
                        size={20} 
                        color={item.danger ? '#EF4444' : '#8B5CF6'} 
                      />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={[
                        styles.settingTitle,
                        item.danger && styles.settingTitleDanger
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.settingItemRight}>
                    {item.type === 'toggle' && (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                        thumbColor="#FFFFFF"
                      />
                    )}
                    {item.type === 'navigation' && (
                      <ChevronRight size={20} color="#9CA3AF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Privacy Notice</Text>
          <Text style={styles.disclaimerText}>
            Your mental health data is private and secure. We use industry-standard 
            encryption and never share your personal information with third parties 
            without your explicit consent.
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF615',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingIconDanger: {
    backgroundColor: '#EF444415',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingTitleDanger: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  settingItemRight: {
    marginLeft: 16,
  },
  disclaimerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});