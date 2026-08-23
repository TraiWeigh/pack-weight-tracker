/**
 * CategoryPickerSheet — v3 §13.2 contextual camera/photos category picker
 *
 * Opens when Camera or Photos is tapped with no category currently open.
 * User taps a category → triggers the caller's action (add item + open photo flow).
 */

import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryTheme } from '@/lib/categoryTheme';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE   = '#2A5740';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.07)';

// ─── CategoryPickerSheet ──────────────────────────────────────────────────────

interface CategoryPickerSheetProps {
  visible: boolean;
  categories: string[];
  source: 'camera' | 'photos';
  onSelect: (category: string) => void;
  onClose: () => void;
}

export function CategoryPickerSheet({
  visible, categories, source, onSelect, onClose,
}: CategoryPickerSheetProps) {
  const insets = useSafeAreaInsets();

  const handleSelect = (cat: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(cat);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {source === 'camera' ? 'Take a Photo For…' : 'Choose a Photo For…'}
            </Text>
            <Text style={styles.headerSub}>
              Select the category to add this item to
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((cat, idx) => {
            const theme = getCategoryTheme(cat, idx);
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catRow, idx > 0 && styles.catRowBorder]}
                onPress={() => handleSelect(cat)}
                activeOpacity={0.65}
              >
                <View style={[styles.catIcon, { backgroundColor: theme.bg }]}>
                  <Ionicons name={theme.icon as any} size={18} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.catName}>{cat}</Text>
                <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    maxHeight: '75%',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DIVIDER,
  },
  headerTitle: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: PRIMARY_TEXT },
  headerSub: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: MUTED, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  list: { flex: 1 },
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13, minHeight: 52,
  },
  catRowBorder: { borderTopWidth: 1, borderTopColor: DIVIDER },
  catIcon: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  catName: { flex: 1, fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT },
});
