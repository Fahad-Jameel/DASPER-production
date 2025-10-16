import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
// import MapView, { Marker } from 'react-native-maps'; // Replaced with WebViewMap
import WebViewMap from '../../components/WebViewMap';

// Components
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImagePreview from '../../components/ImagePreview';
import DamageTypeSelector from '../../components/DamageTypeSelector';

// Services
import DashboardService from '../../services/DashboardService';

import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const AssessmentScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    buildingName: '',
    buildingType: 'residential',
    location: '',
    coordinates: null,
    damageTypes: [],
    isPublic: false,
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 33.6844,
    longitude: 73.0479,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const { user } = useAuth();
  const { theme } = useTheme();
  
  const scrollViewRef = useRef(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const buildingTypes = [
    { value: 'residential', label: 'Residential', icon: 'home' },
    { value: 'commercial', label: 'Commercial', icon: 'business' },
    { value: 'industrial', label: 'Industrial', icon: 'construct' },
  ];

  const damageTypeOptions = [
    'Structural',
    'Fire',
    'Flood',
    'Earthquake',
    'Wind',
    'Settlement',
    'Cracks',
    'Water Damage',
    'Collapse',
  ];

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
  }, []);

  // Reset form state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset form data to initial state
      setFormData({
        buildingName: '',
        buildingType: 'residential',
        location: '',
        coordinates: null,
        damageTypes: [],
        isPublic: false,
      });
      
      // Clear selected image
      setSelectedImage(null);
      
      // Clear errors
      setErrors({});
      
      // Reset to current location if available
      if (currentLocation) {
        setMapRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        
        setFormData(prev => ({
          ...prev,
          coordinates: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          location: `${currentLocation.coords.latitude.toFixed(6)},${currentLocation.coords.longitude.toFixed(6)}`
        }));
      }
    }, [currentLocation])
  );

  const requestPermissions = async () => {
    // Request camera permission
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are required for damage assessment.',
        [{ text: 'OK' }]
      );
    }

    // Request location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      Alert.alert(
        'Location Permission',
        'Location access is required to mark the building location.',
        [{ text: 'OK' }]
      );
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      });
      
      setCurrentLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      
      // Update form data with current coordinates
      setFormData(prev => ({
        ...prev,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      }));
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please select manually on the map.',
        [{ text: 'OK' }]
      );
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.buildingName.trim()) {
      newErrors.buildingName = 'Building name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!selectedImage) {
      newErrors.image = 'Building image is required';
    }

    if (formData.damageTypes.length === 0) {
      newErrors.damageTypes = 'Please select at least one damage type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelection = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add the building image',
      [
        {
          text: 'Camera',
          onPress: () => takePhoto(),
        },
        {
          text: 'Gallery',
          onPress: () => pickImage(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageAsset = result.assets[0];
        // Ensure image has required properties for upload
        const imageWithMetadata = {
          ...imageAsset,
          fileName: imageAsset.fileName || `building_${Date.now()}.jpg`,
          type: imageAsset.type || 'image/jpeg',
        };
        
        // Fix image type if it's just "image"
        if (imageWithMetadata.type === 'image') {
          imageWithMetadata.type = 'image/jpeg';
        }
        
        setSelectedImage(imageWithMetadata);
        if (errors.image) {
          setErrors({ ...errors, image: null });
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageAsset = result.assets[0];
        // Ensure image has required properties for upload
        const imageWithMetadata = {
          ...imageAsset,
          fileName: imageAsset.fileName || `building_${Date.now()}.jpg`,
          type: imageAsset.type || 'image/jpeg',
        };
        
        // Fix image type if it's just "image"
        if (imageWithMetadata.type === 'image') {
          imageWithMetadata.type = 'image/jpeg';
        }
        
        setSelectedImage(imageWithMetadata);
        if (errors.image) {
          setErrors({ ...errors, image: null });
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    try {
      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address.length > 0) {
        const addr = address[0];
        const fullAddress = `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.country || ''}`.trim();
        
        setFormData(prev => ({ 
          ...prev, 
          location: fullAddress,
          coordinates: { latitude, longitude }
        }));
        
        setMapRegion({
          ...mapRegion,
          latitude,
          longitude,
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setFormData(prev => ({ 
        ...prev, 
        coordinates: { latitude, longitude }
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      shakeForm();
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting assessment submission...');
      
      // Test basic network connectivity first
      console.log('Testing basic network connectivity...');
      const networkTest = await DashboardService.testNetworkConnectivity();
      if (!networkTest.success) {
        throw new Error('Network connectivity issue. Please check your internet connection.');
      }
      console.log('Basic network connectivity test passed');
      
      // Test backend connectivity
      console.log('Testing backend connectivity...');
      const connectivityTest = await DashboardService.testBackendConnectivity();
      if (!connectivityTest.success) {
        throw new Error('Backend server is not accessible. Please check if the server is running.');
      }
      console.log('Backend connectivity test passed');
      
      // Prepare form data
      const submitData = new FormData();
      
      submitData.append('building_name', formData.buildingName);
      submitData.append('building_type', formData.buildingType);
      submitData.append('pin_location', formData.coordinates 
        ? `${formData.coordinates.latitude},${formData.coordinates.longitude}`
        : formData.location
      );
      submitData.append('damage_types', formData.damageTypes.join(','));
      submitData.append('is_public', formData.isPublic.toString());

      // Append image
      if (selectedImage && selectedImage.uri) {
        const imageUri = selectedImage.uri;
        const imageName = selectedImage.fileName || 'building_image.jpg';
        const imageType = selectedImage.type || 'image/jpeg';
        
        console.log('Appending image:', { uri: imageUri, name: imageName, type: imageType });
        
        submitData.append('image', {
          uri: imageUri,
          type: imageType,
          name: imageName,
        });
      }

      console.log('Submitting to DashboardService...');
      console.log('FormData contents:', {
        building_name: formData.buildingName,
        building_type: formData.buildingType,
        pin_location: formData.coordinates 
          ? `${formData.coordinates.latitude},${formData.coordinates.longitude}`
          : formData.location,
        damage_types: formData.damageTypes.join(','),
        is_public: formData.isPublic.toString(),
        has_image: !!selectedImage
      });
      
      // Debug FormData entries
      console.log('=== FORMDATA DEBUG ===');
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value);
      }
      console.log('=== END FORMDATA DEBUG ===');
      
      const result = await DashboardService.submitAssessment(submitData);
      
      console.log('Assessment submitted successfully:', result);
      
      // Navigate to results screen
      navigation.navigate('Results', { 
        assessmentData: result,
        assessmentId: result.assessment_id 
      });

    } catch (error) {
      console.error('Assessment submission error:', error);
      let errorMessage = 'Failed to submit assessment. Please check your connection and try again.';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please ensure the backend is running.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Assessment Failed', 
        errorMessage
      );
      shakeForm();
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animatable.View
          animation="fadeInDown"
          duration={800}
          style={styles.headerContent}
        >
          <Text style={styles.headerTitle}>Damage Assessment</Text>
          <Text style={styles.headerSubtitle}>
            Analyze building damage with AI
          </Text>
        </Animatable.View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [{ translateX: shakeAnimation }],
              },
            ]}
          >
            {/* Building Information */}
            <Animatable.View
              animation="fadeInUp"
              delay={400}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Building Information
              </Text>

              {/* Building Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Building Name *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.buildingName && styles.inputError
                ]}>
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={errors.buildingName ? colors.error : colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter building name"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.buildingName}
                    onChangeText={(text) => updateFormData('buildingName', text)}
                    returnKeyType="next"
                  />
                </View>
                {errors.buildingName && (
                  <Text style={styles.errorText}>{errors.buildingName}</Text>
                )}
              </View>

              {/* Building Type */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Building Type *</Text>
                <View style={styles.buildingTypeContainer}>
                  {buildingTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.buildingTypeOption,
                        formData.buildingType === type.value && styles.buildingTypeSelected
                      ]}
                      onPress={() => updateFormData('buildingType', type.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={type.icon}
                        size={24}
                        color={
                          formData.buildingType === type.value
                            ? colors.textLight
                            : colors.textSecondary
                        }
                      />
                      <Text style={[
                        styles.buildingTypeText,
                        formData.buildingType === type.value && styles.buildingTypeTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location and Map */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.location && styles.inputError
                ]}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={errors.location ? colors.error : colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Select location on map"
                    value={formData.location}
                    onChangeText={(text) => updateFormData('location', text)}
                    editable={false}
                  />
                </View>
                {errors.location && (
                  <Text style={styles.errorText}>{errors.location}</Text>
                )}

                <View style={styles.mapContainer}>
                  <WebViewMap
                    initialLocation={{
                      latitude: mapRegion.latitude,
                      longitude: mapRegion.longitude,
                    }}
                    markers={formData.coordinates ? [{
                      latitude: formData.coordinates.latitude,
                      longitude: formData.coordinates.longitude,
                      title: formData.buildingName || 'Selected Location',
                      description: 'Building assessment location'
                    }] : []}
                    height={250}
                    zoomLevel={14}
                    style={styles.map}
                    onLocationSelect={(location) => {
                      console.log('Location selected:', location);
                      // Update form data coordinates
                      setFormData({
                        ...formData,
                        coordinates: {
                          latitude: location.latitude,
                          longitude: location.longitude
                        },
                        location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      });
                      
                      // Update map region
                      setMapRegion({
                        ...mapRegion,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      });
                      
                      // Clear any location error
                      if (errors.location) {
                        setErrors(prev => ({ ...prev, location: '' }));
                      }
                    }}
                  />
                </View>
              </View>

              {/* Image Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Building Image *</Text>
                <TouchableOpacity
                  style={[
                    styles.imagePickerButton,
                    errors.image && styles.inputError
                  ]}
                  onPress={handleImageSelection}
                  activeOpacity={0.8}
                >
                  {selectedImage ? (
                    <ImagePreview 
                      image={selectedImage}
                      onRemove={() => setSelectedImage(null)}
                      onRetake={handleImageSelection}
                    />
                  ) : (
                    <View style={styles.imagePickerContent}>
                      <Ionicons
                        name="camera-outline"
                        size={48}
                        color={errors.image ? colors.error : colors.primary}
                      />
                      <Text style={styles.imagePickerText}>
                        Tap to add image
                      </Text>
                      <Text style={styles.imagePickerSubtext}>
                        Take a photo or select from gallery
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.image && (
                  <Text style={styles.errorText}>{errors.image}</Text>
                )}
              </View>

              {/* Damage Types */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Damage Types *</Text>
                <DamageTypeSelector
                  options={damageTypeOptions}
                  selectedTypes={formData.damageTypes}
                  onSelectionChange={(types) => updateFormData('damageTypes', types)}
                  error={errors.damageTypes}
                />
                {errors.damageTypes && (
                  <Text style={styles.errorText}>{errors.damageTypes}</Text>
                )}
              </View>

              {/* Privacy Toggle */}
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.privacyToggle}
                  onPress={() => updateFormData('isPublic', !formData.isPublic)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={formData.isPublic ? 'eye-outline' : 'eye-off-outline'}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.privacyToggleText}>
                    {formData.isPublic ? 'Public Assessment' : 'Private Assessment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.secondaryGradient}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <LoadingSpinner color={colors.textLight} size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={24} color={colors.textLight} />
                    <Text style={styles.submitButtonText}>Submit Assessment</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...shadowStyles.large,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textLight,
    marginBottom: spacing.sm,
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.subtitle,
    color: colors.textLight,
    opacity: 0.9,
    fontSize: 12,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 80, // Extra space for bottom navigation
  },
  formContainer: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: spacing.md,
    ...shadowStyles.medium,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 45,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    fontSize: 14,
  },
  buildingTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  buildingTypeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 80,
  },
  buildingTypeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadowStyles.small,
  },
  buildingTypeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  buildingTypeTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  mapContainer: {
    height: 250,
    marginTop: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    ...shadowStyles.medium,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imagePickerButton: {
    height: 200,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadowStyles.small,
  },
  imagePickerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  imagePickerText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '600',
  },
  imagePickerSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontSize: 14,
    textAlign: 'center',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
  },
  privacyToggleText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    ...shadowStyles.large,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 15,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.textLight,
    marginLeft: spacing.md,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AssessmentScreen;