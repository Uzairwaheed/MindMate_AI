import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Play, Pause, RotateCcw } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  cancelAnimation 
} from 'react-native-reanimated';

export default function BreathingScreen() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('Prepare');
  const [countdown, setCountdown] = useState(4);
  const [setCount, setSetCount] = useState(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            setPhase(currentPhase => {
              if (currentPhase === 'Inhale') {
                return 'Hold';
              } else if (currentPhase === 'Hold') {
                return 'Exhale';
              } else {
                // Completed a full cycle (Inhale -> Hold -> Exhale)
                setSetCount(prevCount => prevCount + 1);
                return 'Inhale';
              }
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, phase]);

  useEffect(() => {
    if (isActive) {
      if (phase === 'Inhale') {
        scale.value = withTiming(1.5, { duration: 4000 });
      } else if (phase === 'Exhale') {
        scale.value = withTiming(1, { duration: 4000 });
      }
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 500 });
    }
  }, [phase, isActive]);

  const startExercise = () => {
    setIsActive(true);
    setPhase('Inhale');
    setCountdown(4);
  };

  const pauseExercise = () => {
    setIsActive(false);
    cancelAnimation(scale);
  };

  const stopExercise = () => {
    setIsActive(false);
    setPhase('Prepare');
    setCountdown(4);
    setSetCount(0);
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: 500 });
  };

  return (
    <LinearGradient
      colors={['#E6F3FF', '#F3E8FF', '#FAFAFA']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.title}>Breathing Exercise</Text>
        <Text style={styles.subtitle}>4-4-4 Breathing Technique</Text>
      </View>

      <View style={styles.breathingContainer}>
        <Animated.View style={[styles.breathingCircle, animatedStyle]}>
          <Text style={styles.phaseText}>{phase}</Text>
          <Text style={styles.countdownText}>{countdown}</Text>
        </Animated.View>

        <View style={styles.setCountContainer}>
          <Text style={styles.setCountText}>Sets Completed: {setCount}</Text>
        </View>

        <Text style={styles.instructionText}>
          {phase === 'Prepare' && 'Tap start when you\'re ready to begin'}
          {phase === 'Inhale' && 'Breathe in slowly through your nose'}
          {phase === 'Hold' && 'Hold your breath gently'}
          {phase === 'Exhale' && 'Breathe out slowly through your mouth'}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        {!isActive ? (
          <TouchableOpacity style={styles.startButton} onPress={startExercise}>
            <Play size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.pauseButton} onPress={pauseExercise}>
            <Pause size={24} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Pause</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.stopButton} onPress={stopExercise}>
          <RotateCcw size={24} color="#6B7280" />
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits of Deep Breathing</Text>
        <Text style={styles.benefitText}>• Reduces stress and anxiety</Text>
        <Text style={styles.benefitText}>• Lowers blood pressure</Text>
        <Text style={styles.benefitText}>• Improves focus and clarity</Text>
        <Text style={styles.benefitText}>• Promotes relaxation</Text>
      </View>
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
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 40,
  },
  phaseText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 48,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  setCountContainer: {
    marginBottom: 20,
  },
  setCountText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  pauseButton: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  stopButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  stopButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
});