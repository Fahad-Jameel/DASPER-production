import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={colors.primaryGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animatable.View
          animation="fadeInDown"
          duration={1000}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <LottieView
              source={require('../../../assets/animations/disaster-analytics.json')}
              autoPlay
              loop
              style={styles.headerAnimation}
            />
          </View>
          
          <Text style={styles.appTitle}>DASPER</Text>
          <Text style={styles.appSubtitle}>
            Disaster Assessment & Structural Performance Evaluation
          </Text>
        </Animatable.View>

        {/* Features Section */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.featureCard}>
            <Animatable.View
              animation="bounceIn"
              delay={800}
              style={styles.featureItem}
            >
              <View style={styles.featureIcon}>
                <Ionicons name="scan" size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>AI-Powered Analysis</Text>
              <Text style={styles.featureDescription}>
                Advanced computer vision for accurate damage assessment
              </Text>
            </Animatable.View>

            <Animatable.View
              animation="bounceIn"
              delay={1000}
              style={styles.featureItem}
            >
              <View style={styles.featureIcon}>
                <Ionicons name="calculator" size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Cost Estimation</Text>
              <Text style={styles.featureDescription}>
                Real-time repair cost calculations with regional factors
              </Text>
            </Animatable.View>

            <Animatable.View
              animation="bounceIn"
              delay={1200}
              style={styles.featureItem}
            >
              <View style={styles.featureIcon}>
                <Ionicons name="alert" size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Disaster Alerts</Text>
              <Text style={styles.featureDescription}>
                Live notifications for natural disasters and emergencies
              </Text>
            </Animatable.View>

            <Animatable.View
              animation="bounceIn"
              delay={1400}
              style={styles.featureItem}
            >
              <View style={styles.featureIcon}>
                <Ionicons name="analytics" size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>Detailed Reports</Text>
              <Text style={styles.featureDescription}>
                Comprehensive PDF reports with heatmaps and analysis
              </Text>
            </Animatable.View>
          </View>
        </Animated.View>

        {/* CTA Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={1600}
          style={styles.ctaContainer}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={navigateToLogin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.secondaryGradient}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textLight} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={navigateToRegister}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </Animatable.View>

        {/* Background Decorations */}
        <View style={styles.decorations}>
          {[...Array(6)].map((_, index) => (
            <Animatable.View
              key={index}
              animation="pulse"
              iterationCount="infinite"
              duration={3000 + index * 500}
              style={[
                styles.decorationDot,
                {
                  top: Math.random() * height * 0.8,
                  left: Math.random() * width,
                  animationDelay: index * 300,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerAnimation: {
    width: 60,
    height: 60,
  },
  appTitle: {
    ...typography.h1,
    color: colors.textLight,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    letterSpacing: 1.5,
  },
  appSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: spacing.xl,
    ...shadowStyles.large,
  },
  featureItem: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 35, 126, 0.1)',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: {
    ...typography.h6,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaContainer: {
    paddingBottom: spacing.xxl,
  },
  primaryButton: {
    marginBottom: spacing.md,
    borderRadius: 15,
    overflow: 'hidden',
    ...shadowStyles.medium,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textLight,
    marginRight: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: colors.secondaryLight,
    textDecorationLine: 'underline',
  },
  decorations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  decorationDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default WelcomeScreen;