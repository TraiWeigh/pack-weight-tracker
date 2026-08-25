/**
 * FilterDropdown — v3 3-option filter control
 *
 * Options: Category | Location | Photo
 * "Photo" → shows only items with photoDataUrl.
 * Rendered as an absolute overlay below the filter bar.
 * Backdrop tap closes.
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterViewMode = 'category' | 'location' | 'photo';

interface FilterDropdownProps {
  visible: boolean;
  current: FilterViewMode;
  onSelect: (mode: FilterViewMode) => void;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE   = '#2A5740';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.06)'; // content panel borders + option separators — VF §2

const OPTIONS: { value: FilterViewMode; icon: string; label: string; sub: string }[] = [
  { value: 'category', icon: 'list-outline',    label: 'Category', sub: 'Group by gear category' },
  { value: 'location', icon: 'location-outline', label: 'Location', sub: 'Group by assigned location' },
  { value: 'photo',    icon: 'camera-outline',   label: 'Photo',    sub: 'Items with photos only' },
];

// ─── FilterDropdown ───────────────────────────────────────────────────────────

export function FilterDropdown({ visible, current, onSelect, onClose }: FilterDropdownProps) {
  if (!visible) return null;

  const handleSelect = (mode: FilterViewMode) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(mode);
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        activeOpacity={1}
        onPress={onClose}
      />
      {/* Dropdown panel */}
      <View style={styles.panel}>
        {OPTIONS.map((opt, idx) => {
          const active = current === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option,
                idx > 0 && styles.optionBorder,
                active && styles.optionActive,
              ]}
              onPress={() => handleSelect(opt.value)}
              activeOpacity={0.65}
            >
              <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                <Ionicons name={opt.icon as any} size={17} color={active ? '#FFFFFF' : NAV_ACTIVE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </View>
              {active && (
                <Ionicons name="checkmark-circle" size={18} color={NAV_ACTIVE} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,   // caller positions via a wrapper View at filterBar.bottom
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DIVIDER,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    overflow: 'hidden',
    zIndex: 100,
  },
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12, minHeight: 56,
  },
  optionBorder: { borderTopWidth: 1, borderTopColor: DIVIDER },
  optionActive: { backgroundColor: 'rgba(42,87,64,0.04)' },
  optionIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionIconActive: { backgroundColor: NAV_ACTIVE },
  optionLabel: {
    fontSize: 14, fontFamily: 'Arial', color: PRIMARY_TEXT, marginBottom: 2,
  },
  optionLabelActive: { color: NAV_ACTIVE },
  optionSub: {
    fontSize: 12, fontFamily: 'Arial', color: MUTED,
  },
});
