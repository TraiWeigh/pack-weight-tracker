/**
 * ChecklistOverlay — v3 trail checklist
 *
 * Shows only item.checked=true items.
 * Uses separate checklistUse state from context — does NOT mutate item.checked.
 * Clear button clears checklistUse only.
 * Done closes the overlay.
 */

import React, { useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Share,
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
const DIVIDER      = 'rgba(0,0,0,0.06)'; // content row separators — VF §2
const HEADER_BDR   = 'rgba(0,0,0,0.07)'; // AppBar / panel-header bottom borders — VF §2
const CB_CHECKED   = '#4E7D5C';

// ─── ChecklistOverlay ─────────────────────────────────────────────────────────

interface ChecklistOverlayProps {
  visible: boolean;
  onClose: () => void;
  weightUnit: 'imperial' | 'metric';
}

export function ChecklistOverlay({ visible, onClose, weightUnit }: ChecklistOverlayProps) {
  const insets = useSafeAreaInsets();
  const { data, categoryOrder, listName, checklistUse, toggleChecklistItem, clearChecklistUse } = usePackData();

  // Only show checked items
  const sections = useMemo(() =>
    categoryOrder.map((cat, idx) => ({
      title: cat, catIndex: idx,
      items: (data[cat] || []).filter(i => i.checked && (i.desc || i.sub || i.weightOz > 0)),
    })).filter(s => s.items.length > 0),
    [data, categoryOrder]
  );

  const totalPacked = sections.reduce((n, s) => n + s.items.length, 0);
  const usedCount   = sections.reduce((n, s) => n + s.items.filter(i => checklistUse[i.id]).length, 0);

  const handleToggle = (item: GearItem) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleChecklistItem(item.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* D-59/61/62: ← Back, title, conditional Clear, Print, Share icons */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={NAV_ACTIVE} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          {/* v3 §15.1: header title is "Checklist" — prior "Trail Checklist" was wrong. Self-check: MATCH. */}
          <Text style={styles.headerTitle}>Checklist</Text>
          <View style={styles.headerRight}>
            {usedCount > 0 && (
              <TouchableOpacity onPress={clearChecklistUse} hitSlop={8}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              hitSlop={8}
              onPress={() => {
                const lines = sections.flatMap(s =>
                  s.items.map(i => `• ${i.desc || i.sub || 'Item'}${i.qty > 1 ? ` ×${i.qty}` : ''}`)
                );
                Share.share({ message: ['Trail Checklist', '─────────────', ...lines].join('\n'), title: 'Trail Checklist' });
              }}
            >
              <Ionicons name="print-outline" size={20} color={NAV_ACTIVE} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => {
                const lines = sections.flatMap(s =>
                  s.items.map(i => `• ${i.desc || i.sub || 'Item'}${i.qty > 1 ? ` ×${i.qty}` : ''}`)
                );
                Share.share({ message: ['Trail Checklist', '─────────────', ...lines].join('\n'), title: 'Trail Checklist' });
              }}
            >
              <Ionicons name="share-outline" size={20} color={NAV_ACTIVE} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: totalPacked > 0 ? `${Math.round((usedCount / totalPacked) * 100)}%` as any : '0%',
          }]} />
        </View>
        {/* D-60: informational banner */}
        <View style={styles.banner}>
          <Ionicons name="information-circle-outline" size={14} color={MUTED} />
          <Text style={styles.bannerText}>
            {/* v3 §15.1 self-check: prior text was wrong. Corrected to exact v3 spec wording. MATCH. */}
            Showing your selected items. Tick boxes track trail progress separately.
          </Text>
        </View>

        {/* List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {sections.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={52} color="rgba(0,0,0,0.15)" />
              <Text style={styles.emptyTitle}>Nothing Packed Yet</Text>
              <Text style={styles.emptySub}>Check off items in your gear list first.</Text>
            </View>
          ) : (
            sections.map(section => {
              const theme = getCategoryTheme(section.title, section.catIndex);
              return (
                <View key={section.title} style={styles.section}>
                  <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
                    <Ionicons name={theme.icon as any} size={15} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  {section.items.map((item: GearItem) => {
                    const used    = !!checklistUse[item.id];
                    const name    = item.desc || item.sub || 'Unnamed item';
                    const totalOz = calcTotalOz(item.weightOz, item.qty);
                    const wtLabel = item.weightOz > 0 ? formatDisplayWeight(totalOz, weightUnit) : null; // F-09
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.itemRow, used && styles.itemRowUsed]}
                        onPress={() => handleToggle(item)}
                        activeOpacity={0.65}
                      >
                        <View style={[
                          styles.checkbox,
                          { borderColor: used ? CB_CHECKED : 'rgba(0,0,0,0.22)',
                            backgroundColor: used ? CB_CHECKED : 'transparent' },
                        ]}>
                          {used && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                        </View>
                        <Text style={[styles.itemName, used && styles.itemNameUsed]} numberOfLines={2}>
                          {name}{item.qty > 1 ? ` ×${item.qty}` : ''}
                        </Text>
                        {wtLabel && (
                          <Text style={[styles.itemWeight, used && { color: CB_CHECKED }]}>
                            {wtLabel}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // D-59/60/61/62: background updated to PAGE_BG (#F2EDE4) per v3 spec
  container: { flex: 1, backgroundColor: '#F2EDE4' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: HEADER_BDR,
  },
  // ← Back button (D-59)
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { fontSize: 14, fontFamily: 'Arial', color: NAV_ACTIVE },
  // Title centered between Back and right actions (D-59)
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Arial', color: PRIMARY_TEXT, textAlign: 'center' },
  // Right-side action cluster (D-61/62)
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // D-60: banner below progress bar
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 16, paddingVertical: 9,
    backgroundColor: 'rgba(42,87,64,0.05)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(42,87,64,0.10)',
  },
  bannerText: { flex: 1, fontSize: 12, fontFamily: 'Arial', color: MUTED, lineHeight: 16 },
  // Legacy (kept to avoid TS errors from any stray references)
  headerSub: { fontSize: 12, fontFamily: 'Arial', color: MUTED, marginTop: 2 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#F3F4F6' },
  clearBtnText: { fontSize: 13, fontFamily: 'Arial', color: MUTED },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: NAV_ACTIVE },
  doneBtnText: { fontSize: 13, fontFamily: 'Arial', color: '#FFFFFF' },
  progressBar: { height: 3, backgroundColor: 'rgba(0,0,0,0.07)' },
  progressFill: { height: 3, backgroundColor: NAV_ACTIVE, borderRadius: 1.5 },
  scroll: { paddingHorizontal: 12, paddingTop: 12, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Arial', color: MUTED },
  emptySub: { fontSize: 13, fontFamily: 'Arial', color: MUTED, textAlign: 'center' },
  section: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: DIVIDER },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  sectionTitle: { fontSize: 13, fontFamily: 'Arial', color: 'rgba(255,255,255,0.95)' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: DIVIDER,
    paddingLeft: 14, paddingRight: 14, gap: 10,
  },
  itemRowUsed: { backgroundColor: 'rgba(42,87,64,0.04)' },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemName: {
    flex: 1, fontSize: 14.5, fontFamily: 'Arial', color: PRIMARY_TEXT, lineHeight: 20,
  },
  itemNameUsed: { color: NAV_INACTIVE, textDecorationLine: 'line-through', opacity: 0.75 },
  itemWeight: {
    fontSize: 12, fontFamily: 'Arial', color: NAV_INACTIVE,
    letterSpacing: 0.2, flexShrink: 0,
  },
});
