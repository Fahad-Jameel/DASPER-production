import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import LottieView from 'lottie-react-native';
import { colors, typography } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Logo scale and fade animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <LinearGradient
      colors={colors.primaryGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        {[...Array(20)].map((_, index) => (
          <Animatable.View
            key={index}
            animation="pulse"
            iterationCount="infinite"
            duration={2000 + index * 100}
            style={[
              styles.patternDot,
              {
                top: Math.random() * height,
                left: Math.random() * width,
                animationDelay: index * 100,
              },
            ]}
          />
        ))}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Logo Icon */}
          <View style={styles.logoIcon}>
            <LottieView
              source={require('../../assets/animations/building-scan.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>

          {/* App Name */}
          <Animatable.Text
            animation="fadeInUp"
            delay={800}
            style={styles.appName}
          >
            DASPER
          </Animatable.Text>

          {/* Tagline */}
          <Animatable.Text
            animation="fadeInUp"
            delay={1200}
            style={styles.tagline}
          >
            Disaster Assessment & Structural Performance Evaluation
          </Animatable.Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animatable.View
          animation="fadeInUp"
          delay={1600}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingBar}>
            <Animatable.View
              animation="slideInRight"
              duration={2000}
              iterationCount="infinite"
              style={styles.loadingProgress}
            />
          </View>
          <Text style={styles.loadingText}>Initializing AI Models...</Text>
        </Animatable.View>

        {/* Version */}
        <Animatable.Text
          animation="fadeIn"
          delay={2000}
          style={styles.version}
        >
          Version 1.0.0
        </Animatable.Text>
      </View>

      {/* Footer */}
      <Animatable.View
        animation="fadeInUp"
        delay={2200}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Powered by Advanced AI Technology
        </Text>
        <View style={styles.footerDots}>
          {[...Array(3)].map((_, index) => (
            <Animatable.View
              key={index}
              animation="bounce"
              iterationCount="infinite"
              delay={index * 200}
              style={styles.dot}
            />
          ))}
        </View>
      </Animatable.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  lottieAnimation: {
    width: 80,
    height: 80,
  },
  appName: {
    ...typography.h1,
    color: colors.textLight,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingProgress: {
    height: '100%',
    width: '30%',
    backgroundColor: colors.secondaryLight,
    borderRadius: 2,
  },
  loadingText: {
    ...typography.body2,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  version: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    ...typography.body2,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  footerDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryLight,
    marginHorizontal: 4,
  },
});

export default SplashScreen;