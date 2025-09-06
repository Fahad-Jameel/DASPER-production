import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Slider from '@react-native-community/slider';

// Services
import DashboardService from '../services/DashboardService';
import LoadingSpinner from './LoadingSpinner';

import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const FeedbackModal = ({ visible, onClose, assessmentId, assessmentData }) => {
  const [feedbackData, setFeedbackData] = useState({
    userSeverityScore: assessmentData?.damage_assessment?.severity_score || 0.5,
    userDamageTypes: [],
    userComments: '',
    userEstimatedCost: '',
    userAreaEstimate: '',
    repairUrgency: 'medium',
    additionalNotes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const damageTypeOptions = [
    'Structural', 'Fire', 'Flood', 'Earthquake', 'Wind', 
    'Settlement', 'Cracks', 'Water Damage', 'Collapse'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: colors.success, icon: 'time' },
    { value: 'medium', label: 'Medium', color: colors.warning, icon: 'warning' },
    { value: 'high', label: 'High', color: colors.error, icon: 'alert-circle' },
  ];

  const steps = [
    'Severity Assessment',
    'Damage Types',
    'Cost & Details',
    'Additional Feedback'
  ];

  const handleSubmitFeedback = async () => {
    if (!feedbackData.userComments.trim()) {
      Alert.alert('Required', 'Please provide some comments about the assessment.');
      shakeForm();
      return;
    }

    setIsSubmitting(true);

    try {
      // Analyze sentiment first
      const sentiment = await DashboardService.analyzeFeedbackSentiment(
        feedbackData.userComments
      );
      setSentimentAnalysis(sentiment);

      // Submit feedback
      const feedbackPayload = {
        assessment_id: assessmentId,
        user_severity_score: feedbackData.userSeverityScore,
        user_damage_types: feedbackData.userDamageTypes,
        user_comments: feedbackData.userComments,
        user_estimated_cost: feedbackData.userEstimatedCost ? 
          parseFloat(feedbackData.userEstimatedCost) : null,
        user_area_estimate: feedbackData.userAreaEstimate ? 
          parseFloat(feedbackData.userAreaEstimate) : null,
        repair_urgency: feedbackData.repairUrgency,
        additional_notes: feedbackData.additionalNotes,
      };

      await DashboardService.submitFeedback(feedbackPayload);

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. This helps improve our AI models.',
        [{ text: 'OK', onPress: onClose }]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      shakeForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const shakeForm = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleDamageType = (type) => {
    const isSelected = feedbackData.userDamageTypes.includes(type);
    let newTypes;
    
    if (isSelected) {
      newTypes = feedbackData.userDamageTypes.filter(t => t !== type);
    } else {
      newTypes = [...feedbackData.userDamageTypes, type];
    }
    
    setFeedbackData({ ...feedbackData, userDamageTypes: newTypes });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How would you rate the damage severity?</Text>
            <Text style={styles.stepDescription}>
              Our AI assessed: {(assessmentData?.damage_assessment?.severity_score * 100 || 0).toFixed(0)}%
            </Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                Your Assessment: {(feedbackData.userSeverityScore * 100).toFixed(0)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={feedbackData.userSeverityScore}
                onValueChange={(value) => 
                  setFeedbackData({ ...feedbackData, userSeverityScore: value })
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbStyle={styles.sliderThumb}
              />
              
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>No Damage</Text>
                <Text style={styles.sliderLabelText}>Complete Destruction</Text>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select all damage types you observe</Text>
            
            <View style={styles.damageTypesGrid}>
              {damageTypeOptions.map((type) => {
                const isSelected = feedbackData.userDamageTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.damageTypeChip,
                      isSelected && styles.damageTypeChipSelected
                    ]}
                    onPress={() => toggleDamageType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.damageTypeText,
                      isSelected && styles.damageTypeTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Cost & Area Estimates</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your estimated repair cost (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 50000"
                placeholderTextColor={colors.textSecondary}
                value={feedbackData.userEstimatedCost}
                onChangeText={(text) => 
                  setFeedbackData({ ...feedbackData, userEstimatedCost: text })
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Building area estimate (sq.m)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 150"
                placeholderTextColor={colors.textSecondary}
                value={feedbackData.userAreaEstimate}
                onChangeText={(text) => 
                  setFeedbackData({ ...feedbackData, userAreaEstimate: text })
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Repair urgency</Text>
              <View style={styles.urgencyContainer}>
                {urgencyLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.urgencyOption,
                      feedbackData.repairUrgency === level.value && 
                      [styles.urgencyOptionSelected, { borderColor: level.color }]
                    ]}
                    onPress={() => 
                      setFeedbackData({ ...feedbackData, repairUrgency: level.value })
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={level.icon} 
                      size={20} 
                      color={feedbackData.repairUrgency === level.value ? level.color : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.urgencyText,
                      feedbackData.repairUrgency === level.value && 
                      { color: level.color, fontWeight: '600' }
                    ]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Additional Feedback</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Comments about the assessment *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Share your thoughts on the AI assessment accuracy, any missing damage, or other observations..."
                placeholderTextColor={colors.textSecondary}
                value={feedbackData.userComments}
                onChangeText={(text) => 
                  setFeedbackData({ ...feedbackData, userComments: text })
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Additional notes (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Any other information or suggestions..."
                placeholderTextColor={colors.textSecondary}
                value={feedbackData.additionalNotes}
                onChangeText={(text) => 
                  setFeedbackData({ ...feedbackData, additionalNotes: text })
                }
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {sentimentAnalysis && (
              <View style={styles.sentimentContainer}>
                <Text style={styles.sentimentTitle}>Feedback Analysis</Text>
                <View style={styles.sentimentItem}>
                  <Text style={styles.sentimentLabel}>Sentiment:</Text>
                  <Text style={[
                    styles.sentimentValue,
                    { color: sentimentAnalysis.sentiment_label === 'positive' ? 
                      colors.success : sentimentAnalysis.sentiment_label === 'negative' ? 
                      colors.error : colors.warning }
                  ]}>
                    {sentimentAnalysis.sentiment_label?.charAt(0).toUpperCase() + 
                     sentimentAnalysis.sentiment_label?.slice(1)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateX: shakeAnimation }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                <Text style={styles.modalTitle}>Assessment Feedback</Text>
                <Text style={styles.modalSubtitle}>
                  Step {currentStep + 1} of {steps.length}
                </Text>
              </View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {steps.map((step, index) => (
                <View key={index} style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    index <= currentStep && styles.progressDotActive
                  ]}>
                    {index < currentStep ? (
                      <Ionicons name="checkmark" size={12} color={colors.textLight} />
                    ) : (
                      <Text style={[
                        styles.progressDotText,
                        index <= currentStep && styles.progressDotTextActive
                      ]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {index < steps.length - 1 && (
                    <View style={[
                      styles.progressLine,
                      index < currentStep && styles.progressLineActive
                    ]} />
                  )}
                </View>
              ))}
            </View>

            {/* Content */}
            <ScrollView
              style={styles.contentContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animatable.View
                key={currentStep}
                animation="fadeInRight"
                duration={300}
              >
                {renderStepContent()}
              </Animatable.View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <View style={styles.footerButtons}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={[styles.footerButton, styles.backButton]}
                    onPress={prevStep}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.primary} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.footerButton,
                    styles.nextButton,
                    isSubmitting && styles.nextButtonDisabled
                  ]}
                  onPress={currentStep === steps.length - 1 ? handleSubmitFeedback : nextStep}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.primaryGradient}
                    style={styles.nextButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner color={colors.textLight} size="small" />
                    ) : (
                      <>
                        <Text style={styles.nextButtonText}>
                          {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
                        </Text>
                        <Ionicons 
                          name={currentStep === steps.length - 1 ? "checkmark" : "arrow-forward"} 
                          size={20} 
                          color={colors.textLight} 
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    ...shadowStyles.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  modalTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressDotTextActive: {
    color: colors.textLight,
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  stepContent: {
    paddingVertical: spacing.lg,
  },
  stepTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stepDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sliderContainer: {
    marginVertical: spacing.lg,
  },
  sliderLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sliderLabelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  damageTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  damageTypeChip: {
    backgroundColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: '30%',
    alignItems: 'center',
  },
  damageTypeChipSelected: {
    backgroundColor: colors.primary,
  },
  damageTypeText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  damageTypeTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body1,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
  },
  urgencyOptionSelected: {
    borderWidth: 2,
  },
  urgencyText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  sentimentContainer: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  sentimentTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sentimentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  sentimentValue: {
    ...typography.body2,
    fontWeight: '600',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backButtonText: {
    ...typography.button,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  nextButton: {
    marginLeft: spacing.sm,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  nextButtonText: {
    ...typography.button,
    color: colors.textLight,
    marginRight: spacing.sm,
  },
});

export default FeedbackModal;