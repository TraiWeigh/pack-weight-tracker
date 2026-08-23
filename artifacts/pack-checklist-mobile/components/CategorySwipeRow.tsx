/**
 * CategorySwipeRow — v3 §11.1 right-side swipe reveal for category bars
 *
 * Wraps a SectionHeader with two swipe-reveal action buttons:
 *   - Edit (88px, NAV_ACTIVE green): rename category
 *   - Delete (88px, #B03A2E brick red): confirm delete
 *
 * Swipe zone: right 40% of screen (checked via pageX of initial touch).
 * Works alongside stickySectionHeadersEnabled.
 */

import React, { useRef } from 'react';
import {
  Alert, Animated, Dimensions, Platform, PanResponder,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE  = '#2A5740';
const DELETE_RED  = '#B03A2E';
const ACTION_W    = 88;
const REVEAL_W    = ACTION_W * 2;    // edit + delete = 176px

// shared close reference (only one category swipe open at a time)
let _closeCatSwipe: (() => void) | null = null;

// ─── CategorySwipeRow ─────────────────────────────────────────────────────────

interface CategorySwipeRowProps {
  catName: string;
  onRename: (catName: string) => void;
  onDelete: (catName: string) => void;
  children: React.ReactNode;
}

export function CategorySwipeRow({
  catName, onRename, onDelete, children,
}: CategorySwipeRowProps) {
  const tx          = useRef(new Animated.Value(0)).current;
  const isOpenRef   = useRef(false);
  const isSwiping   = useRef(false);

  const closeAnim = () => {
    Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 230, friction: 24 }).start();
    isOpenRef.current = false;
    _closeCatSwipe = null;
  };

  const closeRef = useRef(closeAnim);
  closeRef.current = closeAnim;

  const { width: SCREEN_W } = Dimensions.get('window');

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, g) => {
        // Only allow swipe from the right 40% zone
        const inRightZone = evt.nativeEvent.pageX > SCREEN_W * 0.60;
        return (
          inRightZone &&
          !isSwiping.current &&
          Math.abs(g.dx) > 8 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.4
        );
      },
      onPanResponderGrant: () => {
        isSwiping.current = true;
        tx.stopAnimation();
        tx.setOffset(isOpenRef.current ? -REVEAL_W : 0);
        tx.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        const base = isOpenRef.current ? -REVEAL_W : 0;
        tx.setValue(Math.max(-REVEAL_W, Math.min(0, base + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        tx.flattenOffset();
        isSwiping.current = false;
        if (!isOpenRef.current && g.dx < -50) {
          // Close any previously open category swipe
          _closeCatSwipe?.();
          _closeCatSwipe = closeRef.current;
          isOpenRef.current = true;
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Animated.spring(tx, { toValue: -REVEAL_W, useNativeDriver: true, tension: 230, friction: 24 }).start();
        } else if (isOpenRef.current && g.dx > 50) {
          closeRef.current();
        } else if (isOpenRef.current) {
          Animated.spring(tx, { toValue: -REVEAL_W, useNativeDriver: true, tension: 230, friction: 24 }).start();
        } else {
          Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 230, friction: 24 }).start();
        }
      },
      onPanResponderTerminate: () => {
        tx.flattenOffset();
        isSwiping.current = false;
        Animated.spring(tx, { toValue: isOpenRef.current ? -REVEAL_W : 0, useNativeDriver: true, tension: 230, friction: 24 }).start();
      },
    })
  ).current;

  const handleEdit = () => {
    closeRef.current();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'ios') {
      Alert.prompt('Rename Category', undefined, (text) => {
        if (text?.trim() && text.trim() !== catName) onRename(text.trim());
      }, 'plain-text', catName);
    } else {
      Alert.alert('Rename', 'Category renaming via swipe requires iOS. Use long-press on Android.');
    }
  };

  const handleDelete = () => {
    closeRef.current();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Category',
      `Remove "${catName}"? All items in this category will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(catName) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Action buttons behind the header */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: NAV_ACTIVE }]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: DELETE_RED }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding header */}
      <Animated.View
        style={{ transform: [{ translateX: tx }] }}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  actions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: ACTION_W,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
