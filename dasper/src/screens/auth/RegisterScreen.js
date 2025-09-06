import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { colors, typography, spacing, shadowStyles } from '../../theme/theme';
import LoadingSpinner from '../../components/LoadingSpinner';
import SocialLoginButtons from '../../components/SocialLoginButtons';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register, loginWithFirebase, clearError } = useAuth();
  const { theme } = useTheme();

  const inputRefs = {
    fullName: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    organization: useRef(null),
    phone: useRef(null),
  };

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      shakeForm();
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      // Check if server is reachable
      const authService = require('../../services/AuthService').default;
      const isServerConnected = await authService.checkServerConnection();
      
      if (!isServerConnected) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to the server. Please check your internet connection or try again later.',
          [{ text: 'OK' }]
        );
        shakeForm();
        setIsLoading(false);
        return;
      }
      
      const userData = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        organization: formData.organization.trim(),
        phone: formData.phone.trim(),
      };

      const result = await register(userData);
      
      if (result.success) {
        // Navigation will be handled by the auth state change
        Alert.alert(
          'Registration Successful',
          'Welcome to DASPER! Your account has been created successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again');
        shakeForm();
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred');
      shakeForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider, token) => {
    setIsLoading(true);
    clearError();

    try {
      const result = await loginWithFirebase(token);
      
      if (!result.success) {
        Alert.alert('Registration Failed', result.error || 'Social login failed');
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Social login failed');
    } finally {
      setIsLoading(false);
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
        toValue: 10,
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

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderInput = (
    field,
    placeholder,
    icon,
    keyboardType = 'default',
    secureTextEntry = false,
    showPasswordToggle = false,
    nextField = null
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {placeholder}
        {['fullName', 'email', 'password', 'confirmPassword'].includes(field) && (
          <Text style={styles.required}> *</Text>
        )}
      </Text>
      <View style={[
        styles.inputWrapper,
        errors[field] && styles.inputError
      ]}>
        <Ionicons
          name={icon}
          size={20}
          color={errors[field] ? colors.error : colors.textSecondary}
          style={styles.inputIcon}
        />
        <TextInput
          ref={inputRefs[field]}
          style={styles.textInput}
          placeholder={`Enter your ${placeholder.toLowerCase()}`}
          placeholderTextColor={colors.textSecondary}
          value={formData[field]}
          onChangeText={(text) => updateFormData(field, text)}
          keyboardType={keyboardType}
          autoCapitalize={field === 'email' ? 'none' : 'words'}
          autoComplete={field === 'email' ? 'email' : field === 'password' ? 'password' : 'off'}
          secureTextEntry={secureTextEntry}
          returnKeyType={nextField ? 'next' : 'done'}
          onSubmitEditing={() => {
            if (nextField && inputRefs[nextField]?.current) {
              inputRefs[nextField].current.focus();
            } else if (!nextField) {
              handleRegister();
            }
          }}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => {
              if (field === 'password') {
                setShowPassword(!showPassword);
              } else {
                setShowConfirmPassword(!showConfirmPassword);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                (field === 'password' ? showPassword : showConfirmPassword)
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <LinearGradient
      colors={theme.isDark ? colors.darkGradient : colors.primaryGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animatable.View
            animation="fadeInDown"
            duration={800}
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textLight} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join DASPER today</Text>
            </View>
          </Animatable.View>

          {/* Registration Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [{ translateX: shakeAnimation }],
              },
            ]}
          >
            <Animatable.View
              animation="fadeInUp"
              delay={400}
              style={styles.formCard}
            >
              {/* Form Inputs */}
              {renderInput('fullName', 'Full Name', 'person-outline', 'default', false, false, 'email')}
              {renderInput('email', 'Email Address', 'mail-outline', 'email-address', false, false, 'password')}
              {renderInput('password', 'Password', 'lock-closed-outline', 'default', !showPassword, true, 'confirmPassword')}
              {renderInput('confirmPassword', 'Confirm Password', 'lock-closed-outline', 'default', !showConfirmPassword, true, 'organization')}
              {renderInput('organization', 'Organization (Optional)', 'business-outline', 'default', false, false, 'phone')}
              {renderInput('phone', 'Phone Number (Optional)', 'call-outline', 'phone-pad', false, false, null)}

              {/* Terms and Conditions */}
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && (
                    <Ionicons name="checkmark" size={16} color={colors.textLight} />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <Text style={styles.errorText}>{errors.terms}</Text>
              )}

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.secondaryGradient}
                  style={styles.registerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <LoadingSpinner color={colors.textLight} size="small" />
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.textLight} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or sign up with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <SocialLoginButtons
                onGoogleLogin={(token) => handleSocialLogin('google', token)}
                onFacebookLogin={(token) => handleSocialLogin('facebook', token)}
                disabled={isLoading}
              />

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={navigateToLogin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: spacing.xl,
    ...shadowStyles.large,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadowStyles.medium,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  registerButtonText: {
    ...typography.button,
    color: colors.textLight,
    marginRight: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;