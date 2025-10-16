import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../../config/env.js';
import { colors, typography, spacing } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const BackendConfigScreen = ({ navigation }) => {
  const [backendUrl, setBackendUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    loadSavedUrl();
  }, []);

  const loadSavedUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('backend_url');
      if (savedUrl) {
        setBackendUrl(savedUrl);
      }
    } catch (error) {
      console.error('Error loading saved URL:', error);
    }
  };

  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const testConnection = async (url) => {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!backendUrl.trim()) {
      Alert.alert('Error', 'Please enter a backend URL');
      return;
    }

    if (!validateUrl(backendUrl)) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., http://192.168.1.100:5000)');
      return;
    }

    setIsValidating(true);

    try {
      // Test connection
      const isConnected = await testConnection(backendUrl);
      
      if (isConnected) {
        // Save URL to AsyncStorage and update ENV
        await AsyncStorage.setItem('backend_url', backendUrl);
        ENV.API_BASE_URL = backendUrl;
        
        Alert.alert(
          'Success!',
          'Backend URL configured successfully',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to auth flow
                navigation.replace('Welcome');
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Connection Failed',
          'Could not connect to the backend. Please check the URL and try again.',
          [
            {
              text: 'Continue Anyway',
              onPress: () => {
                // Save URL anyway and continue
                AsyncStorage.setItem('backend_url', backendUrl);
                ENV.API_BASE_URL = backendUrl;
                navigation.replace('Welcome');
              },
            },
            { text: 'Retry', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      Alert.alert(
        'Error',
        'Failed to test connection. Please check your network and try again.',
        [
          {
            text: 'Continue Anyway',
            onPress: () => {
              AsyncStorage.setItem('backend_url', backendUrl);
              ENV.API_BASE_URL = backendUrl;
              navigation.replace('Welcome');
            },
          },
          { text: 'Retry', style: 'cancel' },
        ]
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Configuration',
      'You can configure the backend URL later in settings. Using default URL.',
      [
        {
          text: 'Continue',
          onPress: () => navigation.replace('Welcome'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <LinearGradient
      colors={colors.primaryGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animatable.View
            animation="fadeInDown"
            delay={200}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="server-outline" size={60} color={colors.textLight} />
            </View>
            <Text style={styles.title}>Backend Configuration</Text>
            <Text style={styles.subtitle}>
              Configure your backend server URL to connect with the DASPER API
            </Text>
          </Animatable.View>

          {/* Form */}
          <Animatable.View
            animation="fadeInUp"
            delay={400}
            style={styles.formContainer}
          >
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Backend Server URL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={backendUrl}
                  onChangeText={setBackendUrl}
                  placeholder="http://192.168.1.100:5000"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
              <Text style={styles.helpText}>
                Enter the IP address and port of your DASPER backend server
              </Text>
            </View>

            {/* Example URLs */}
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Common Examples:</Text>
              <View style={styles.examplesList}>
                <Text style={styles.exampleText}>• http://192.168.1.100:5000</Text>
                <Text style={styles.exampleText}>• http://10.0.2.2:5000 (Android Emulator)</Text>
                <Text style={styles.exampleText}>• http://localhost:5000 (iOS Simulator)</Text>
                <Text style={styles.exampleText}>• https://your-domain.com</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSubmit}
                disabled={isValidating || isLoading}
              >
                {isValidating ? (
                  <ActivityIndicator color={colors.textLight} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.textLight} />
                    <Text style={styles.buttonText}>Connect & Continue</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleSkip}
                disabled={isValidating || isLoading}
              >
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Skip for Now
                </Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Footer Info */}
          <Animatable.View
            animation="fadeInUp"
            delay={600}
            style={styles.footerInfo}
          >
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>
                You can change this URL later in Settings
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="wifi" size={16} color={colors.textLight} />
              <Text style={styles.infoText}>
                Make sure your device and server are on the same network
              </Text>
            </View>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    ...typography.h2,
    color: colors.textLight,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body1,
    color: colors.textLight,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body1,
    color: colors.textDark,
    paddingVertical: spacing.md,
  },
  helpText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  examplesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  examplesTitle: {
    ...typography.body2,
    color: colors.textLight,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  examplesList: {
    paddingLeft: spacing.sm,
  },
  exampleText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    ...typography.body1,
    color: colors.textLight,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  footerInfo: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
});

export default BackendConfigScreen;
