import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft, CircleCheck as CheckCircle } from 'lucide-react-native';

const quizQuestions = [
  {
    question: "Over the last 2 weeks, how often have you been feeling nervous, anxious, or on edge?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    scores: [0, 1, 2, 3]
  },
  {
    question: "Over the last 2 weeks, how often have you been unable to stop or control worrying?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    scores: [0, 1, 2, 3]
  },
  {
    question: "Over the last 2 weeks, how often have you had trouble relaxing?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    scores: [0, 1, 2, 3]
  },
  {
    question: "Over the last 2 weeks, how often have you been feeling down, depressed, or hopeless?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    scores: [0, 1, 2, 3]
  },
  {
    question: "Over the last 2 weeks, how often have you had little interest or pleasure in doing things?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    scores: [0, 1, 2, 3]
  }
];

export default function QuizScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = quizQuestions[currentQuestion].scores[optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateResults = () => {
    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    
    if (totalScore <= 4) {
      return {
        level: 'Minimal',
        color: '#10B981',
        description: 'You appear to be managing well overall. Keep up the good work with self-care practices.',
        recommendation: 'Continue with regular wellness activities and maintain healthy habits.'
      };
    } else if (totalScore <= 9) {
      return {
        level: 'Mild',
        color: '#F59E0B',
        description: 'You may be experiencing some mild stress or anxiety. This is very common.',
        recommendation: 'Consider incorporating more relaxation techniques and speaking with someone you trust.'
      };
    } else {
      return {
        level: 'Moderate to Severe',
        color: '#EF4444',
        description: 'You may be experiencing significant stress or anxiety. Professional support could be helpful.',
        recommendation: 'We strongly recommend speaking with a mental health professional.'
      };
    }
  };

  const results = showResults ? calculateResults() : null;

  if (showResults && results) {
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
          <Text style={styles.title}>Quiz Results</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.resultCard}>
            <View style={[styles.resultHeader, { backgroundColor: `${results.color}15` }]}>
              <CheckCircle size={32} color={results.color} />
              <Text style={[styles.resultLevel, { color: results.color }]}>
                {results.level}
              </Text>
            </View>
            
            <Text style={styles.resultDescription}>{results.description}</Text>
            <Text style={styles.recommendation}>{results.recommendation}</Text>

            {results.level !== 'Minimal' && (
              <TouchableOpacity 
                style={[styles.therapyButton, { backgroundColor: results.color }]}
                onPress={() => router.push('/wellness/therapy')}
              >
                <Text style={styles.therapyButtonText}>Get Support Resources</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              This quiz is for informational purposes only and is not a substitute for professional medical advice, 
              diagnosis, or treatment. If you're experiencing thoughts of self-harm, please contact emergency services immediately.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
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
        <Text style={styles.title}>Mental Health Quiz</Text>
        <Text style={styles.subtitle}>
          Question {currentQuestion + 1} of {quizQuestions.length}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {quizQuestions[currentQuestion].question}
          </Text>
          
          <View style={styles.optionsContainer}>
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  answers[currentQuestion] === quizQuestions[currentQuestion].scores[index] && styles.selectedOption
                ]}
                onPress={() => handleAnswer(index)}
              >
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion] === quizQuestions[currentQuestion].scores[index] && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About this assessment</Text>
          <Text style={styles.infoText}>
            This quiz is based on validated mental health screening tools (GAD-7 and PHQ-9) 
            used by healthcare professionals to assess anxiety and depression symptoms.
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
    paddingBottom: 16,
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
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionCard: {
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
  questionText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    backgroundColor: '#8B5CF615',
    borderColor: '#8B5CF6',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  resultHeader: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  resultLevel: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginTop: 12,
  },
  resultDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  recommendation: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  therapyButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  therapyButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  disclaimer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    lineHeight: 16,
    textAlign: 'center',
  },
});