/**
 * PreviewOverlay — v3 §13.3 full-screen preview overlay.
 *
 * Shows ALL items regardless of checked state.
 * Uses separate preview-local `checklistUse` state — does NOT mutate item.checked.
 * Print/PDF button triggers native Share with text export.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, Share,
  StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { usePackData, GearItem } from '@/context/PackDataContext';
import { calcTotalOz, formatDisplayWeight } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.06)';
const CB_CHECKED   = '#4E7D5C';

// ─── PreviewOverlay ───────────────────────────────────────────────────────────

interface PreviewOverlayProps {
  visible: boolean;
  onClose: () => void;
  weightUnit: 'imperial' | 'metric';
}

export function PreviewOverlay({ visible, onClose, weightUnit }: PreviewOverlayProps) {
  const insets = useSafeAreaInsets();
  const { data, categoryOrder, listName } = usePackData();

  // Preview-local check state — separate from item.checked
  const [previewChecked, setPreviewChecked] = useState<Record<string, boolean>>({});

  const handleToggle = useCallback((id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // F-03: reset local check state whenever overlay closes
  useEffect(() => {
    if (!visible) setPreviewChecked({});
  }, [visible]);

  const handleClear = useCallback(() => {
    setPreviewChecked({});
  }, []);

  const handlePrint = useCallback(() => {
    const lines: string[] = [`📋 ${listName}`, '─────────────────────'];
    for (const cat of categoryOrder) {
      const items = (data[cat] || []).filter(i => i.desc || i.sub || i.weightOz > 0);
      if (items.length === 0) continue;
      lines.push(`\n${cat.toUpperCase()}`);
      for (const item of items) {
        const name = item.desc || item.sub || 'Unnamed item';
        const qty  = item.qty > 1 ? ` ×${item.qty}` : '';
        const wt   = item.weightOz > 0
          ? ` (${formatDisplayWeight(calcTotalOz(item.weightOz, item.qty), weightUnit)})` // F-04
          : '';
        const tick = previewChecked[item.id] ? '✓ ' : '○ ';
        lines.push(`  ${tick}${name}${qty}${wt}`);
      }
    }
    Share.share({ message: lines.join('\n'), title: listName });
  }, [data, categoryOrder, listName, previewChecked, weightUnit]);

  // All items with any content
  const populated = useMemo(() =>
    categoryOrder.map((cat, idx) => ({
      title: cat,
      catIndex: idx,
      items: (data[cat] || []).filter(i => i.desc || i.sub || i.weightOz > 0 || i.photoDataUrl),
    })).filter(s => s.items.length > 0),
    [data, categoryOrder]
  );

  const checkedCount = Object.values(previewChecked).filter(Boolean).length;
  const totalCount   = populated.reduce((n, s) => n + s.items.length, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Preview</Text>
            <Text style={styles.headerSub}>
              {checkedCount}/{totalCount} checked in preview
            </Text>
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={8}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={styles.printBtn} hitSlop={8}>
            <Ionicons name="print-outline" size={18} color="#FFFFFF" />
            <Text style={styles.printBtnText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={MUTED} />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />

        {/* List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {populated.map(section => {
            const theme = getCategoryTheme(section.title, section.catIndex);
            return (
              <View key={section.title} style={styles.section}>
                <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
                  <Ionicons name={theme.icon as any} size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionCount}>{section.items.length} items</Text>
                </View>
                {section.items.map((item: GearItem) => {
                  const checked  = !!previewChecked[item.id];
                  const name     = item.desc || item.sub || 'Unnamed item';
                  const totalOz  = calcTotalOz(item.weightOz, item.qty);
                  const wtLabel  = item.weightOz > 0
                    ? formatDisplayWeight(totalOz, weightUnit)  // F-04
                    : null;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemRow, checked && styles.itemRowChecked]}
                      onPress={() => handleToggle(item.id)}
                      activeOpacity={0.65}
                    >
                      <View style={[
                        styles.checkbox,
                        { borderColor: checked ? CB_CHECKED : 'rgba(0,0,0,0.18)',
                          backgroundColor: checked ? CB_CHECKED : 'transparent' },
                      ]}>
                        {checked && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                      </View>
                      <Text style={[styles.itemName, checked && styles.itemNameChecked]} numberOfLines={2}>
                        {name}{item.qty > 1 ? ` ×${item.qty}` : ''}
                      </Text>
                      {wtLabel && (
                        <Text style={[styles.itemWeight, checked && { color: CB_CHECKED }]}>
                          {wtLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
          {populated.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="list-outline" size={48} color="rgba(0,0,0,0.18)" />
              <Text style={styles.emptyText}>No items to preview</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: PRIMARY_TEXT },
  headerSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: MUTED, marginTop: 2 },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#F3F4F6',
  },
  clearBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: MUTED },
  printBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: NAV_ACTIVE,
  },
  printBtnText: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFFFFF' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: DIVIDER },
  scroll: { paddingHorizontal: 12, paddingTop: 12, gap: 12 },
  section: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: DIVIDER },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  sectionTitle: {
    flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: 'rgba(255,255,255,0.95)',
  },
  sectionCount: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.70)',
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: DIVIDER,
    paddingLeft: 14, paddingRight: 14, gap: 10,
  },
  itemRowChecked: { backgroundColor: 'rgba(42,87,64,0.04)' },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemName: {
    flex: 1, fontSize: 14.5, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT, lineHeight: 20,
  },
  itemNameChecked: { color: NAV_INACTIVE, opacity: 0.7 },
  itemWeight: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: NAV_INACTIVE,
    letterSpacing: 0.2, flexShrink: 0,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: MUTED },
});
