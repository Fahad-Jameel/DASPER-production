import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

// Initialize WebBrowser for Expo Auth Session
WebBrowser.maybeCompleteAuthSession();

const SocialLoginButtons = ({ 
  onGoogleLogin, 
  onFacebookLogin, 
  disabled = false 
}) => {
  // Google OAuth configuration
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '1004273760155-r3mbcif44prqi2cp717crnlgvtg7nn2o.apps.googleusercontent.com',
    iosClientId: '1004273760155-r3mbcif44prqi2cp717crnlgvtg7nn2o.apps.googleusercontent.com',
    androidClientId: '1004273760155-r3mbcif44prqi2cp717crnlgvtg7nn2o.apps.googleusercontent.com',
    expoClientId: '1004273760155-r3mbcif44prqi2cp717crnlgvtg7nn2o.apps.googleusercontent.com',
  });

  // Facebook OAuth configuration
  const [facebookRequest, facebookResponse, facebookPromptAsync] = Facebook.useAuthRequest({
    clientId: 'your-facebook-app-id',
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      // For IdToken auth requests, we need to use the idToken instead of accessToken
      const { id_token } = googleResponse.params;
      console.log("Received Google ID token, sending to backend");
      onGoogleLogin(id_token);
    } else if (googleResponse?.type === 'error') {
      console.error('Google auth error:', googleResponse.error);
      Alert.alert('Google Login Error', googleResponse.error?.message || 'Failed to connect with Google');
    }
  }, [googleResponse]);

  React.useEffect(() => {
    if (facebookResponse?.type === 'success') {
      const { authentication } = facebookResponse;
      onFacebookLogin(authentication.accessToken);
    }
  }, [facebookResponse]);

  const handleGoogleLogin = async () => {
    try {
      console.log("Starting Google auth flow...");
      await googlePromptAsync();
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Google Login Error', 'Failed to connect with Google');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      Alert.alert(
        'Facebook Login Setup Required',
        'Please configure proper Facebook OAuth credentials in the app config before using social login.',
        [{ text: 'OK' }]
      );
      // await facebookPromptAsync();
    } catch (error) {
      Alert.alert('Facebook Login Error', 'Failed to connect with Facebook');
    }
  };

  return (
    <View style={styles.container}>
      {/* Google Login Button */}
      <TouchableOpacity
        style={[styles.socialButton, styles.googleButton, disabled && styles.disabled]}
        onPress={handleGoogleLogin}
        disabled={disabled || !googleRequest}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-google" size={20} color="#DB4437" style={styles.socialIcon} />
        <Text style={[styles.socialButtonText, styles.googleText]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Facebook Login Button */}
      <TouchableOpacity
        style={[styles.socialButton, styles.facebookButton, disabled && styles.disabled]}
        onPress={handleFacebookLogin}
        disabled={disabled || !facebookRequest}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.socialIcon} />
        <Text style={[styles.socialButtonText, styles.facebookText]}>
          Continue with Facebook
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowStyles.small,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderColor: '#dadce0',
  },
  facebookButton: {
    backgroundColor: '#ffffff',
    borderColor: '#1877F2',
  },
  socialIcon: {
    marginRight: spacing.sm,
  },
  socialButtonText: {
    ...typography.button,
    fontSize: 15,
  },
  googleText: {
    color: '#3c4043',
  },
  facebookText: {
    color: '#1877F2',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default SocialLoginButtons;