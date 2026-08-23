/**
 * PhotoListAssignmentSheet — "What is this photo?" assignment sheet (state 4).
 *
 * Shows thumbnail (52×52) + title + three options:
 *   Location → open Location Naming form
 *   Item     → open Item Destination sheet
 *   Decide later → close sheet, retain pending capture
 *
 * z-index equivalent = 213 in v3.
 * Geometry: thumbnail 52×52 border-radius 10; options minHeight 60 padding 12/14;
 * icon pill 36×36 border-radius 9 bg NAV_ACTIVE.
 */

import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const NAV_ACTIVE = '#2A5740';
const PRIMARY    = '#1A2920';
const MUTED      = '#667270';
const DIVIDER    = 'rgba(0,0,0,0.06)';

interface Props {
  visible:        boolean;
  photoDataUrl:   string | null;
  onDecideLater:  () => void;
  onPickLocation: () => void;
  onPickItem:     () => void;
}

export function PhotoListAssignmentSheet({
  visible, photoDataUrl, onDecideLater, onPickLocation, onPickItem,
}: Props) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 500, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible, slideY]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDecideLater}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} onPress={onDecideLater} activeOpacity={1} accessible={false} />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(40, insets.bottom + 20), transform: [{ translateY: slideY }] },
        ]}
      >
        {/* Header: thumbnail + title */}
        <View style={styles.header}>
          {photoDataUrl ? (
            <Image source={{ uri: photoDataUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailFallback]}>
              <Ionicons name="camera-outline" size={22} color="#fff" />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>What is this photo?</Text>
            <Text style={styles.subtitle}>Choose how to organize it in your Photo List.</Text>
          </View>
        </View>

        <View style={styles.sep} />

        {/* Location option */}
        <TouchableOpacity style={styles.optionRow} onPress={onPickLocation} activeOpacity={0.75}>
          <View style={styles.pill}>
            <Ionicons name="location-outline" size={18} color="#fff" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Location</Text>
            <Text style={styles.optionSub}>A place where gear can belong</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={MUTED} />
        </TouchableOpacity>

        <View style={styles.sep} />

        {/* Item option */}
        <TouchableOpacity style={styles.optionRow} onPress={onPickItem} activeOpacity={0.75}>
          <View style={styles.pill}>
            <Ionicons name="archive-outline" size={18} color="#fff" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Item</Text>
            <Text style={styles.optionSub}>A piece of gear to name and place</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={MUTED} />
        </TouchableOpacity>

        <View style={styles.sep} />

        {/* Decide later */}
        <TouchableOpacity style={styles.decideLaterBtn} onPress={onDecideLater} activeOpacity={0.7}>
          <Text style={styles.decideLaterText}>Decide later</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: NAV_ACTIVE,
    flexShrink: 0,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
  },
  subtitle: {
    fontSize: 12.5,
    color: MUTED,
    lineHeight: 17,
    marginTop: 3,
  },
  sep: {
    height: 1,
    backgroundColor: DIVIDER,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: NAV_ACTIVE,
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
  decideLaterBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#F5F0E8',
  },
  decideLaterText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
});
