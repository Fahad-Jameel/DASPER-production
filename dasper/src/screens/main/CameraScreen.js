import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const cameraRef = useRef(null);

  const { onImageCaptured } = route.params || {};

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
    
    if (cameraStatus === 'granted' && mediaLibraryStatus === 'granted') {
      setHasPermission(true);
    } else {
      setHasPermission(false);
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to capture images.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Grant Permissions', onPress: requestPermissions },
        ]
      );
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: true,
        });

        // Save to media library
        await MediaLibrary.saveToLibraryAsync(photo.uri);

        // Return image to previous screen
        if (onImageCaptured) {
          onImageCaptured({
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            exif: photo.exif,
          });
        }

        navigation.goBack();
      } catch (error) {
        console.error('Camera capture error:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        
        if (onImageCaptured) {
          onImageCaptured({
            uri: image.uri,
            width: image.width,
            height: image.height,
          });
        }

        navigation.goBack();
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const toggleCameraType = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const goBack = () => {
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color={colors.error} />
        <Text style={styles.permissionText}>Camera permission not granted</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
        ratio="4:3"
      >
        {/* Grid Overlay */}
        {showGrid && (
          <View style={styles.gridOverlay}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, styles.gridLineVertical]} />
            <View style={[styles.gridLine, styles.gridLineHorizontal1]} />
            <View style={[styles.gridLine, styles.gridLineHorizontal2]} />
          </View>
        )}

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color={colors.textLight} />
          </TouchableOpacity>
          
          <View style={styles.topRightControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleGrid}>
              <Ionicons 
                name={showGrid ? "grid" : "grid-outline"} 
                size={24} 
                color={colors.textLight} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons 
                name={
                  flashMode === Camera.Constants.FlashMode.off 
                    ? "flash-off" 
                    : "flash"
                } 
                size={24} 
                color={colors.textLight} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Center Guidelines */}
        <View style={styles.centerGuidelines}>
          <View style={styles.centerSquare}>
            <Text style={styles.guidelineText}>Frame the building damage</Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity 
            style={styles.galleryButton} 
            onPress={pickFromGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="images" size={24} color={colors.textLight} />
            <Text style={styles.galleryButtonText}>Gallery</Text>
          </TouchableOpacity>

          {/* Capture Button */}
          <Animatable.View
            animation={isCapturing ? "pulse" : undefined}
            iterationCount="infinite"
            duration={1000}
          >
            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
              onPress={takePicture}
              disabled={isCapturing}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner}>
                {isCapturing ? (
                  <View style={styles.capturingIndicator} />
                ) : (
                  <Ionicons name="camera" size={32} color={colors.textLight} />
                )}
              </View>
            </TouchableOpacity>
          </Animatable.View>

          <TouchableOpacity 
            style={styles.flipButton} 
            onPress={toggleCameraType}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-reverse" size={24} color={colors.textLight} />
            <Text style={styles.flipButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={styles.instructionsContainer}
        >
          <View style={styles.instructionsBubble}>
            <Text style={styles.instructionsText}>
              💡 Tip: Ensure good lighting and focus on damaged areas
            </Text>
          </View>
        </Animatable.View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  permissionText: {
    ...typography.h6,
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  permissionButtonText: {
    ...typography.button,
    color: colors.textLight,
  },
  camera: {
    flex: 1,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    left: '33.33%',
  },
  gridLineHorizontal1: {
    height: 1,
    width: '100%',
    top: '33.33%',
  },
  gridLineHorizontal2: {
    height: 1,
    width: '100%',
    top: '66.66%',
  },
  topControls: {
    position: 'absolute',
    top: spacing.xxl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  topRightControls: {
    flexDirection: 'row',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  centerGuidelines: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
  },
  centerSquare: {
    width: 200,
    height: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  guidelineText: {
    ...typography.body2,
    color: colors.textLight,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  galleryButtonText: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.textLight,
  },
  captureButtonActive: {
    backgroundColor: colors.primary,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
  },
  flipButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  flipButtonText: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: spacing.xxl * 2 + 100,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  instructionsBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    maxWidth: width - spacing.lg * 2,
  },
  instructionsText: {
    ...typography.body2,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default CameraScreen;