import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Upload, Smile, Frown, Meh } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function SentimentAnalysisScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (granted) {
        setShowCamera(true);
      }
    } else {
      setShowCamera(true);
    }
  };

  const analyzeImage = () => {
    // Simulate sentiment analysis
    const moods = ['Happy', 'Neutral', 'Sad', 'Anxious', 'Calm'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    setAnalysisResult(randomMood);
    setShowCamera(false);
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'Happy':
        return <Smile size={32} color="#10B981" />;
      case 'Sad':
        return <Frown size={32} color="#EF4444" />;
      case 'Anxious':
        return <Frown size={32} color="#F59E0B" />;
      default:
        return <Meh size={32} color="#6B7280" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Happy':
        return '#10B981';
      case 'Sad':
        return '#EF4444';
      case 'Anxious':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera}>
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowCamera(false)}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.cameraInstructions}>
              Position your face in the frame and tap to analyze
            </Text>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={analyzeImage}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

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
        <Text style={styles.title}>Sentiment Analysis</Text>
        <Text style={styles.subtitle}>Analyze your mood through facial expression</Text>
      </View>

      <View style={styles.content}>
        {analysisResult ? (
          <View style={styles.resultContainer}>
            <View style={styles.resultCard}>
              <View style={styles.moodIconContainer}>
                {getMoodIcon(analysisResult)}
              </View>
              <Text style={styles.resultTitle}>Analysis Complete</Text>
              <Text style={[styles.moodResult, { color: getMoodColor(analysisResult) }]}>
                {analysisResult}
              </Text>
              <Text style={styles.resultDescription}>
                Based on your facial expression, you appear to be feeling {analysisResult.toLowerCase()}.
              </Text>
              
              {analysisResult === 'Sad' || analysisResult === 'Anxious' ? (
                <TouchableOpacity 
                  style={styles.therapyButton}
                  onPress={() => router.push('/wellness/therapy')}
                >
                  <Text style={styles.therapyButtonText}>Get Support Resources</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={requestCameraPermission}
            >
              <Camera size={32} color="#8B5CF6" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
              <Text style={styles.actionButtonDescription}>
                Use your camera to analyze your mood
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'Upload from gallery will be available soon!')}
            >
              <Upload size={32} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Upload Photo</Text>
              <Text style={styles.actionButtonDescription}>
                Choose a photo from your gallery
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Our AI analyzes facial expressions to detect emotions like happiness, 
            sadness, anxiety, and more. This helps you become more aware of your 
            emotional state and provides personalized recommendations.
          </Text>
        </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  actionContainer: {
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
  },
  moodIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  moodResult: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  resultDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  therapyButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  therapyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  infoContainer: {
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
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  cameraInstructions: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});