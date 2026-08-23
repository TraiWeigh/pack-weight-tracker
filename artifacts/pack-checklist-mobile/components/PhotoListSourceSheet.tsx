/**
 * PhotoListSourceSheet — "Add a Photo" source selection sheet (state 2).
 *
 * Camera row and Photos row, each with 34×34 dark-green icon pills.
 * Cancel row at bottom. z-index equivalent = 212 in v3.
 *
 * On selection, compresses to JPEG quality=0.55 and calls onCapture(dataUrl).
 * Uses expo-image-picker for both Camera and Photos.
 */

import React, { useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const NAV_ACTIVE = '#2A5740';
const PRIMARY    = '#1A2920';
const MUTED      = '#667270';
const DIVIDER    = 'rgba(0,0,0,0.06)';

interface Props {
  visible:   boolean;
  onClose:   () => void;
  onCapture: (dataUrl: string) => void;
}

export function PhotoListSourceSheet({ visible, onClose, onCapture }: Props) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 400, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible, slideY]);

  const handleCamera = async () => {
    onClose();
    await new Promise(r => setTimeout(r, 200)); // let sheet close first

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera Access', 'Enable camera access in Settings to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.55,
      base64: true,
      allowsEditing: false,
    } as ImagePicker.ImagePickerOptions);

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUrl = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      onCapture(dataUrl);
    }
  };

  const handlePhotos = async () => {
    onClose();
    await new Promise(r => setTimeout(r, 200));

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos Access', 'Enable photo library access in Settings to choose photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.55,
      base64: true,
      allowsEditing: false,
    } as ImagePicker.ImagePickerOptions);

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUrl = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      onCapture(dataUrl);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} accessible={false} />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(40, insets.bottom + 20), transform: [{ translateY: slideY }] },
        ]}
      >
        {/* Sheet header */}
        <Text style={styles.title}>Add a Photo</Text>
        <Text style={styles.subtitle}>
          Your photo will be saved here until you choose whether it belongs to a location or an item.
        </Text>

        {/* Camera row */}
        <TouchableOpacity style={styles.optionRow} onPress={handleCamera} activeOpacity={0.75}>
          <View style={[styles.pill, { backgroundColor: NAV_ACTIVE }]}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Camera</Text>
            <Text style={styles.optionSub}>Take a new photo</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sep} />

        {/* Photos row */}
        <TouchableOpacity style={styles.optionRow} onPress={handlePhotos} activeOpacity={0.75}>
          <View style={[styles.pill, { backgroundColor: NAV_ACTIVE }]}>
            <Ionicons name="images-outline" size={18} color="#fff" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Photos</Text>
            <Text style={styles.optionSub}>Choose from your photo library</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sep} />

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: MUTED,
    lineHeight: 17,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingVertical: 10,
  },
  pill: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: 15,
    fontWeight: '650' as any,
    color: PRIMARY,
  },
  optionSub: {
    fontSize: 12.5,
    color: MUTED,
    marginTop: 2,
  },
  sep: {
    height: 1,
    backgroundColor: DIVIDER,
  },
  cancelBtn: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: '#F5F0E8',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
});
