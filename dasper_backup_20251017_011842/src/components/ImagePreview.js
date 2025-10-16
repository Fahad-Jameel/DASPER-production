import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const { width } = Dimensions.get('window');

const ImagePreview = ({ image, onRemove, onRetake }) => {
  // Add null check for image
  if (!image || !image.uri) {
    return null;
  }

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: image.uri }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Image Overlay */}
        <View style={styles.overlay}>
          <View style={styles.imageInfo}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.imageInfoText}>Image Selected</Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={onRetake}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={onRemove}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Image Details */}
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {image.fileName || 'building_image.jpg'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="resize-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {image.width}x{image.height}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="cloud-upload-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {image.fileSize ? `${(image.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Ready'}
          </Text>
        </View>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    ...shadowStyles.medium,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  imageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  imageInfoText: {
    ...typography.body2,
    color: colors.success,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  retakeButton: {
    marginRight: spacing.sm,
  },
  removeButton: {
    marginLeft: spacing.sm,
  },
  retakeText: {
    ...typography.body2,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  removeText: {
    ...typography.body2,
    color: colors.error,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  details: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
});

export default ImagePreview;