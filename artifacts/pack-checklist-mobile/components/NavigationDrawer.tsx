/**
 * NavigationDrawer — v3 left-side drawer
 *
 * v3 §10.1: Slides in from left, 55% shell width (~260px).
 * 5 navigation rows: Home (coming soon), Master Library (disabled),
 * My Lists, Help & Tutorials (coming soon), Settings (coming soon).
 * Footer: handedness toggle.
 * Close: ✕ button, backdrop tap, leftward swipe ≥50px.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
const DRAWER_W     = Math.min(280, Dimensions.get('window').width * 0.78);

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavDrawerProps {
  visible: boolean;
  onClose: () => void;
  onMyLists: () => void;       // opens Locker
  handedness: 'right' | 'left';
  onToggleHandedness: () => void;
}

// ─── Row config ───────────────────────────────────────────────────────────────

type NavRow = {
  icon: string;
  label: string;
  sub?: string;
  disabled?: boolean;
  action: 'home' | 'master' | 'myLists' | 'help' | 'settings';
};

const NAV_ROWS: NavRow[] = [
  { icon: 'home-outline',          label: 'Home',              sub: 'Dashboard & quick-start', action: 'home'    },
  { icon: 'library-outline',       label: 'Master Library',    sub: 'Coming soon',             action: 'master', disabled: true },
  { icon: 'folder-open-outline',   label: 'My Lists',          sub: 'Saved & recent',          action: 'myLists' },
  { icon: 'help-circle-outline',   label: 'Help & Tutorials',  sub: 'Guides and tips',         action: 'help'    },
  { icon: 'settings-outline',      label: 'Settings',          sub: 'App preferences',         action: 'settings' },
];

// ─── NavigationDrawer ─────────────────────────────────────────────────────────

export function NavigationDrawer({
  visible, onClose, onMyLists, handedness, onToggleHandedness,
}: NavDrawerProps) {
  const insets = useSafeAreaInsets();
  const tx = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 220, friction: 24 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(tx, { toValue: -DRAWER_W, useNativeDriver: true, tension: 260, friction: 28 }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, tx, backdropOpacity]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && g.dx < 0 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }
      },
    })
  ).current;

  const handleRowAction = (action: NavRow['action']) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case 'myLists':
        onClose();
        setTimeout(onMyLists, 250);
        break;
      case 'home':
      case 'help':
      case 'settings':
        // Coming soon — show a brief Alert or just close
        onClose();
        break;
      case 'master':
        // disabled — no-op
        break;
    }
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[styles.drawer, { paddingTop: insets.top, width: DRAWER_W, transform: [{ translateX: tx }] }]}
        {...pan.panHandlers}
      >
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerLogoRow}>
            <Ionicons name="checkbox-outline" size={22} color={NAV_ACTIVE} />
            <Text style={styles.drawerLogoText}>TrailWeigh</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={MUTED} />
          </TouchableOpacity>
        </View>

        <View style={styles.drawerDivider} />

        {/* Navigation rows */}
        <View style={styles.navRows}>
          {NAV_ROWS.map((row) => (
            <TouchableOpacity
              key={row.action}
              style={[styles.navRow, row.disabled && styles.navRowDisabled]}
              onPress={() => !row.disabled && handleRowAction(row.action)}
              activeOpacity={row.disabled ? 1 : 0.65}
            >
              <View style={[styles.navRowIcon, row.disabled && { opacity: 0.4 }]}>
                <Ionicons
                  name={row.icon as any}
                  size={20}
                  color={row.action === 'myLists' ? NAV_ACTIVE : PRIMARY_TEXT}
                />
              </View>
              <View style={styles.navRowText}>
                <Text style={[
                  styles.navRowLabel,
                  row.disabled && styles.navRowLabelDisabled,
                  row.action === 'myLists' && { color: NAV_ACTIVE },
                ]}>
                  {row.label}
                </Text>
                {row.sub && (
                  <Text style={[styles.navRowSub, row.disabled && { opacity: 0.5 }]}>
                    {row.sub}
                  </Text>
                )}
              </View>
              {row.disabled && (
                <Text style={styles.navRowBadge}>Soon</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer: handedness toggle */}
        <View style={[styles.drawerFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.drawerDivider} />
          <View style={styles.handednessRow}>
            <Ionicons name="hand-left-outline" size={16} color={MUTED} style={{ marginRight: 6 }} />
            <Text style={styles.handednessLabel}>Handedness</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.handednessToggle, handedness === 'left' && styles.handednessToggleActive]}
              onPress={onToggleHandedness}
            >
              <Ionicons
                name={handedness === 'right' ? 'hand-right-outline' : 'hand-left-outline'}
                size={14}
                color={handedness === 'left' ? '#FFFFFF' : MUTED}
              />
              <Text style={[styles.handednessToggleText, handedness === 'left' && { color: '#FFFFFF' }]}>
                {handedness === 'right' ? 'Right' : 'Left'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 }, elevation: 16,
    flexDirection: 'column',
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  drawerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  drawerLogoText: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: PRIMARY_TEXT },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginHorizontal: 0 },
  navRows: { flex: 1, paddingTop: 8 },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
  },
  navRowDisabled: { opacity: 0.55 },
  navRowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  navRowText: { flex: 1 },
  navRowLabel: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: PRIMARY_TEXT,
  },
  navRowLabelDisabled: { color: MUTED },
  navRowSub: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: MUTED, marginTop: 1,
  },
  navRowBadge: {
    fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: NAV_ACTIVE,
    backgroundColor: 'rgba(42,87,64,0.10)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 5, overflow: 'hidden',
  },
  drawerFooter: { paddingTop: 0 },
  handednessRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  handednessLabel: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: MUTED,
  },
  handednessToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#F3F4F6',
  },
  handednessToggleActive: {
    backgroundColor: NAV_ACTIVE, borderColor: NAV_ACTIVE,
  },
  handednessToggleText: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: MUTED,
  },
});
