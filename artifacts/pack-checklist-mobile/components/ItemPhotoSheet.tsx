/**
 * ItemPhotoSheet — photo management for a specific item (standard list mode).
 *
 * v3 §13.2 item photo flow:
 * - Take New Photo (camera)
 * - Choose from Library (photos)
 * - Delete Photo (when item has a photo)
 * - Cancel
 *
 * Calls onCapture(dataUrl) on success.
 * Calls onDelete() when user taps Delete Photo.
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE   = '#2A5740';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.07)';
const DELETE_RED   = '#B03A2E';
const MAX_IMAGE_EDGE = 800;

async function compressPhoto(asset: ImagePicker.ImagePickerAsset): Promise<string | null> {
  const longestEdge = Math.max(asset.width, asset.height);
  const resizeAction = longestEdge > MAX_IMAGE_EDGE
    ? [{ resize: asset.width >= asset.height ? { width: MAX_IMAGE_EDGE } : { height: MAX_IMAGE_EDGE } }]
    : [];
  const compressed = await ImageManipulator.manipulateAsync(asset.uri, resizeAction, {
    base64: true,
    compress: 0.72,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return compressed.base64 ? `data:image/jpeg;base64,${compressed.base64}` : compressed.uri;
}

// ─── ItemPhotoSheet ───────────────────────────────────────────────────────────

interface ItemPhotoSheetProps {
  visible: boolean;
  hasPhoto: boolean;
  onCapture: (dataUrl: string) => void;
  onDelete: () => void;
  onClose: () => void;
  /** F-05: auto-launch this picker as soon as the sheet becomes visible */
  initialSource?: 'camera' | 'library';
  /** F-06: called when user explicitly cancels (not when camera/library auto-closes) */
  onCancel?: () => void;
}

async function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  try {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // P3 opens the camera directly and does not insert a crop/edit step.
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        return await compressPhoto(result.assets[0]);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required.');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        // P3 opens the photo library directly and does not insert a crop/edit step.
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        return await compressPhoto(result.assets[0]);
      }
    }
  } catch {}
  return null;
}

export function ItemPhotoSheet({
  visible, hasPhoto, onCapture, onDelete, onClose, initialSource, onCancel,
}: ItemPhotoSheetProps) {
  const insets = useSafeAreaInsets();

  // F-05: auto-launch the requested picker when the sheet becomes visible
  const didAutoLaunch = useRef(false);
  useEffect(() => {
    if (visible && initialSource && !didAutoLaunch.current) {
      didAutoLaunch.current = true;
      const launch = async () => {
        onClose();   // close the sheet so system picker appears on top
        const dataUrl = await pickImage(initialSource);
        if (dataUrl) onCapture(dataUrl);
        else onCancel?.();   // user cancelled system picker → clean up blank item
      };
      setTimeout(launch, 150);
    }
    if (!visible) didAutoLaunch.current = false;
  }, [visible, initialSource]);   // eslint-disable-line react-hooks/exhaustive-deps

  const handleCamera = async () => {
    onClose();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dataUrl = await pickImage('camera');
    if (dataUrl) onCapture(dataUrl);
  };

  const handleLibrary = async () => {
    onClose();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dataUrl = await pickImage('library');
    if (dataUrl) onCapture(dataUrl);
  };

  const handleDelete = () => {
    onClose();
    Alert.alert('Delete Photo', 'Remove this photo from the item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Photo', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { onCancel?.(); onClose(); }} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{hasPhoto ? 'Edit Photo' : 'Add a Photo'}</Text>

        {/* Camera row */}
        <TouchableOpacity style={styles.optRow} onPress={handleCamera} activeOpacity={0.65}>
          <View style={styles.optIcon}>
            <Ionicons name="camera-outline" size={22} color={NAV_ACTIVE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optLabel}>Take a new photo</Text>
            <Text style={styles.optSub}>Use your camera</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Library row */}
        <TouchableOpacity style={styles.optRow} onPress={handleLibrary} activeOpacity={0.65}>
          <View style={styles.optIcon}>
            <Ionicons name="images-outline" size={22} color={NAV_ACTIVE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optLabel}>Choose from library</Text>
            <Text style={styles.optSub}>Select an existing photo</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
        </TouchableOpacity>

        {/* Delete row (only if item already has a photo) */}
        {hasPhoto && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optRow} onPress={handleDelete} activeOpacity={0.65}>
              <View style={[styles.optIcon, styles.optIconDelete]}>
                <Ionicons name="trash-outline" size={22} color={DELETE_RED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optLabel, { color: DELETE_RED }]}>Delete Photo</Text>
                <Text style={styles.optSub}>Remove the current photo</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Cancel */}
        <View style={[styles.divider, { marginTop: 8 }]} />
        <TouchableOpacity style={styles.cancelRow} onPress={() => { onCancel?.(); onClose(); }} activeOpacity={0.65}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center', marginTop: 10, marginBottom: 8,
  },
  title: {
    fontSize: 16, fontFamily: 'Arial', color: PRIMARY_TEXT,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  divider: { height: 1, backgroundColor: DIVIDER },
  optRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 60,
  },
  optIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  optIconDelete: { backgroundColor: 'rgba(176,58,46,0.10)' },
  optLabel: { fontSize: 15, fontFamily: 'Arial', color: PRIMARY_TEXT, marginBottom: 2 },
  optSub: { fontSize: 12.5, fontFamily: 'Arial', color: MUTED },
  cancelRow: {
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: 15, fontFamily: 'Arial', color: MUTED },
});
