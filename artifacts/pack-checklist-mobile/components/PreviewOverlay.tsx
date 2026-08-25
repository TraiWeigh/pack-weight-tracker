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
import { calcTotalOz, calcWeights, formatWeight, largeUnit } from '@/lib/weightUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.06)';
const CB_CHECKED   = '#2D5A27';

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
  const [beforeClear, setBeforeClear] = useState<Record<string, boolean> | null>(null);

  const handleToggle = useCallback((id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // P3 R0081: opening Preview snapshots the working-list checks. Preview edits
  // remain local and are discarded on close.
  useEffect(() => {
    if (!visible) return;
    const initial: Record<string, boolean> = {};
    categoryOrder.forEach(cat => (data[cat] || []).forEach(item => {
      initial[item.id] = item.checked;
    }));
    setPreviewChecked(initial);
    setBeforeClear(null);
  }, [visible, data, categoryOrder]);

  const handleClear = useCallback(() => {
    setBeforeClear(previewChecked);
    setPreviewChecked(prev => Object.fromEntries(Object.keys(prev).map(id => [id, false])));
  }, [previewChecked]);

  const handleUndo = useCallback(() => {
    if (!beforeClear) return;
    setPreviewChecked(beforeClear);
    setBeforeClear(null);
  }, [beforeClear]);

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
          ? ` (${formatWeight(calcTotalOz(item.weightOz, item.qty), weightUnit, 'small')} ${weightUnit === 'metric' ? 'g' : 'oz'})`
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

  const displayData = useMemo(() => Object.fromEntries(
    categoryOrder.map(cat => [cat, (data[cat] || []).map(item => ({
      ...item, checked: previewChecked[item.id] ?? item.checked,
    }))])
  ), [data, categoryOrder, previewChecked]);
  const { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz } = calcWeights(displayData);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const summaryCells = [
    { label: 'Base Weight', oz: baseWeightOz },
    { label: 'Clothing Worn', oz: clothingWornOz },
    { label: 'Dog Pack', oz: dogPackOz },
    { label: 'Expendables', oz: expendablesOz },
    { label: 'Grand Total', oz: grandTotalOz },
  ].filter(cell => cell.label === 'Base Weight' || cell.label === 'Grand Total' || cell.oz > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header — D-55: ← Back replaces ✕ Close */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={NAV_ACTIVE} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview</Text>
          <TouchableOpacity onPress={handlePrint} style={styles.printBtn} hitSlop={8} accessibilityLabel="Print gear list">
            <Ionicons name="print-outline" size={19} color={NAV_INACTIVE} />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        {/* D-56: Banner text per v3 §13.3 */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            All items in this list — tap the printer icon to print or download.
          </Text>
        </View>

        <TouchableOpacity
          onPress={beforeClear ? handleUndo : handleClear}
          style={styles.clearPill}
          accessibilityLabel={beforeClear ? 'Undo clear checks' : 'Clear all preview checkmarks'}
        >
          <Ionicons name={beforeClear ? 'arrow-undo-outline' : 'checkbox-outline'} size={18} color="#FFFFFF" />
          <Text style={styles.clearPillText}>{beforeClear ? 'Undo' : 'Clear Checks'}</Text>
        </TouchableOpacity>

        {/* List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {populated.length > 0 && <View style={styles.paper}>
            <View style={styles.paperHeader}>
              <View style={styles.brandRow}>
                <Text style={styles.brand}>TrailWeigh</Text>
                <Text style={styles.documentType}>Pack Checklist</Text>
              </View>
              <Text style={styles.date}>{date}</Text>
            </View>
            <View style={styles.weightStrip}>
              {summaryCells.map((cell, idx) => (
                <View key={cell.label} style={[styles.weightCell, idx > 0 && styles.weightCellBorder]}>
                  <Text style={styles.weightLabel}>{cell.label}</Text>
                  <Text style={[styles.weightValue, cell.label === 'Grand Total' && styles.grandValue]}>
                    {formatWeight(cell.oz, weightUnit, 'large')} {largeUnit(weightUnit)}
                  </Text>
                </View>
              ))}
            </View>
          {populated.map(section => (
              <View key={section.title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <View style={styles.columnHeader}>
                  <View style={styles.checkboxColumn} />
                  <Text style={styles.typeColumnHeader}>Type</Text>
                  <Text style={styles.nameColumnHeader}>Name</Text>
                  <Text style={styles.weightColumnHeader}>Weight</Text>
                </View>
                {section.items.map((item: GearItem) => {
                  const checked  = !!previewChecked[item.id];
                  const totalOz  = calcTotalOz(item.weightOz, item.qty);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemRow, section.items.indexOf(item) % 2 === 0 && styles.itemRowAlt]}
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
                      <Text style={styles.itemType} numberOfLines={1}>{item.sub}</Text>
                      <Text style={styles.itemName} numberOfLines={2}>{item.desc || '—'}</Text>
                      <Text style={styles.itemWeight}>{formatWeight(totalOz, weightUnit, 'small')} {weightUnit === 'metric' ? 'g' : 'oz'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
          ))}
            <Text style={styles.footer}>TrailWeigh Pack Checklist  •  Printed {date}</Text>
          </View>}
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
  // D-58: PAGE_BG from v3 visual formula §1
  container: { flex: 1, backgroundColor: '#F2EDE4' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
  },
  // D-55: ← Back button replaces ✕ Close
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 },
  backBtnText: { fontSize: 14, fontFamily: 'Arial', color: NAV_ACTIVE },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Arial', color: PRIMARY_TEXT },
  headerSub: { fontSize: 12, fontFamily: 'Arial', color: MUTED, marginTop: 2 },
  printBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  // D-56: banner below header
  banner: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'rgba(42,87,64,0.07)', borderBottomWidth: 1, borderBottomColor: 'rgba(42,87,64,0.12)',
  },
  bannerText: { fontSize: 12, fontFamily: 'Arial', color: NAV_INACTIVE, lineHeight: 17 },
  clearPill: {
    minHeight: 44, marginHorizontal: 16, marginTop: 10, marginBottom: 6,
    borderRadius: 100, backgroundColor: NAV_ACTIVE, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  clearPillText: { fontSize: 15, fontFamily: 'Arial', color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: DIVIDER },
  scroll: { paddingHorizontal: 0, paddingTop: 8 },
  paper: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12 },
  paperHeader: { borderBottomWidth: 2, borderBottomColor: '#3C5A3C', paddingBottom: 6, marginBottom: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  brand: { fontSize: 22, fontFamily: 'Arial', color: '#2D5A27' },
  documentType: { fontSize: 14, fontFamily: 'Arial', color: '#777777' },
  date: { fontSize: 9, color: '#999999', marginTop: 2 },
  weightStrip: {
    flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#F4F8F4',
    borderWidth: 1, borderColor: '#C5D8C5', borderRadius: 6, marginBottom: 14,
  },
  weightCell: { flex: 1, minWidth: 58, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  weightCellBorder: { borderLeftWidth: 1, borderLeftColor: '#C5D8C5' },
  weightLabel: { fontSize: 7.5, fontFamily: 'Arial', color: '#888888', textTransform: 'uppercase', textAlign: 'center' },
  weightValue: { fontSize: 12, fontFamily: 'Arial', color: '#1A1A1A', marginTop: 2 },
  grandValue: { fontSize: 14, color: '#2D5A27' },
  section: { marginBottom: 10 },
  sectionHeader: {
    backgroundColor: '#3C5A3C', paddingHorizontal: 8, paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 9, fontFamily: 'Arial', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1.2,
  },
  columnHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  checkboxColumn: { width: 22 },
  typeColumnHeader: { width: 90, fontSize: 7, color: '#AAAAAA', textTransform: 'uppercase' },
  nameColumnHeader: { flex: 1, fontSize: 7, color: '#AAAAAA', textTransform: 'uppercase' },
  weightColumnHeader: { width: 64, fontSize: 7, color: '#AAAAAA', textTransform: 'uppercase', textAlign: 'right' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 32,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingHorizontal: 4,
  },
  itemRowAlt: { backgroundColor: '#F8FBF8' },
  checkbox: {
    width: 16, height: 16, borderRadius: 2, borderWidth: 2, marginRight: 6,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemType: { width: 84, fontSize: 11, fontFamily: 'Arial', color: '#666666' },
  itemName: { flex: 1, fontSize: 12, color: '#111111' },
  itemWeight: { width: 64, textAlign: 'right', fontSize: 10.5, fontFamily: 'Arial', color: '#2D5A27' },
  footer: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E0E0E0', fontSize: 7, color: '#BBBBBB', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Arial', color: MUTED },
});
