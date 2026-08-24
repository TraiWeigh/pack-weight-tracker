/**
 * ItemDetailPanel — v3 §11.3 inline item detail panel
 *
 * Renders inline below the item row in the SectionList.
 * DETAIL_BG = '#F5F0E8' (linen).
 * 9 rows: Name, Weight, Quantity, Total, Move, Location, Photo, Photo viewer, Delete.
 * autoFocus on Name when first opened.
 * Only one panel open per category enforced by parent.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Image, Platform, StyleSheet, Text,
  TextInput, TouchableOpacity, View, ActionSheetIOS,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GearItem, PackLocation } from '@/context/PackDataContext';
import { calcTotalOz, formatDisplayWeight } from '@/lib/weightUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DETAIL_BG    = '#F5F0E8';
const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
// v3 VF §9: DETAIL_BDR = rgba(0,0,0,0.06). Prior value 0.08 was wrong. Self-check: MATCH after fix.
const DIVIDER      = 'rgba(0,0,0,0.06)';
const DELETE_RED   = '#B03A2E';

// ─── ItemDetailPanel ──────────────────────────────────────────────────────────

interface ItemDetailPanelProps {
  item: GearItem;
  category: string;
  categories: string[];
  locations: PackLocation[];
  weightUnit: 'imperial' | 'metric';
  onRename: (newName: string) => void;
  onUpdate: (patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub' | 'photoDataUrl' | 'locationId'>>) => void;
  onMove: (newCategory: string) => void;
  onDelete: () => void;
  onPhoto: () => void;
  onClose: () => void;
  /** D-42: create a new location; callback receives the new location id */
  onCreateLocation?: (name: string, onCreated: (locId: string) => void) => void;
}

export function ItemDetailPanel({
  item, category, categories, locations, weightUnit,
  onRename, onUpdate, onMove, onDelete, onPhoto, onClose, onCreateLocation,
}: ItemDetailPanelProps) {
  const nameRef = useRef<TextInput>(null);
  const [localName, setLocalName] = useState(item.desc || item.sub || '');
  // F-08: localWt is stored in display unit (oz or g depending on weightUnit)
  const ozToDisplay = (oz: number) =>
    weightUnit === 'metric' ? String(Math.round(oz * 28.3495)) : String(oz);
  const displayToOz = (s: string) => {
    const v = parseFloat(s) || 0;
    return weightUnit === 'metric' ? v / 28.3495 : v;
  };
  const [localWt,   setLocalWt  ] = useState(item.weightOz > 0 ? ozToDisplay(item.weightOz) : '');
  const [localQty,  setLocalQty ] = useState(item.qty);
  // N-03: controls the inline photo viewer — toggled by "View Photo" button
  const [showViewer, setShowViewer] = useState(false);

  // Sync back if item changes externally or unit switches
  useEffect(() => {
    setLocalName(item.desc || item.sub || '');
    setLocalWt(item.weightOz > 0 ? ozToDisplay(item.weightOz) : '');
    setLocalQty(item.qty);
    setShowViewer(false); // N-03: collapse viewer when item switches
  }, [item.id, weightUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  // autoFocus Name on mount
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const commitName = useCallback(() => {
    const trimmed = localName.trim();
    if (trimmed !== (item.desc || item.sub || '').trim()) {
      onRename(trimmed);
    }
  }, [localName, item.desc, item.sub, onRename]);

  const commitWeight = useCallback(() => {
    const oz = Math.max(0, displayToOz(localWt));
    if (Math.abs(oz - item.weightOz) > 0.0001) {
      onUpdate({ weightOz: oz });
    }
  // D-39: weightUnit must be in deps — displayToOz reads it via closure
  }, [localWt, item.weightOz, onUpdate, weightUnit]);

  const adjustQty = useCallback((delta: number) => {
    const next = Math.max(1, Math.min(99, localQty + delta));
    setLocalQty(next);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate({ qty: next });
  }, [localQty, onUpdate]);

  const handleMove = useCallback(() => {
    const others = categories.filter(c => c !== category);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...others, 'Cancel'], cancelButtonIndex: others.length, title: 'Move to Category' },
        (idx) => { if (idx < others.length) onMove(others[idx]); },
      );
    } else {
      Alert.alert('Move Item', 'Select category', [
        ...others.map(c => ({ text: c, onPress: () => onMove(c) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [categories, category, onMove]);

  // D-42: opens name prompt and creates a new location via onCreateLocation callback
  const promptCreateLocation = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt('New Location', 'Enter a name for the new location:', (text) => {
        if (text?.trim() && onCreateLocation) {
          onCreateLocation(text.trim(), (locId) => onUpdate({ locationId: locId }));
        }
      }, 'plain-text');
    } else {
      Alert.alert('Create Location', 'Location creation is available on iOS.');
    }
  }, [onCreateLocation, onUpdate]);

  const handleLocation = useCallback(() => {
    const locOptions = [
      { label: 'No Location', value: null as string | null },
      ...locations.map(l => ({ label: l.name, value: l.id as string | null })),
    ];
    if (Platform.OS === 'ios') {
      const labels = locOptions.map(o => o.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, 'Create New Location…', 'Cancel'],
          cancelButtonIndex: labels.length + 1,
          title: 'Assign Location',
        },
        (idx) => {
          if (idx < locOptions.length) {
            onUpdate({ locationId: locOptions[idx].value || undefined });
          } else if (idx === locOptions.length) {
            promptCreateLocation();
          }
        },
      );
    } else {
      Alert.alert('Assign Location', undefined, [
        ...locOptions.map(o => ({
          text: o.label,
          onPress: () => onUpdate({ locationId: o.value || undefined }),
        })),
        ...(onCreateLocation ? [{ text: 'Create New Location…', onPress: promptCreateLocation }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [locations, onUpdate, onCreateLocation, promptCreateLocation]);

  const handleDelete = useCallback(() => {
    // Items 6 & 7: match the final-v3 delete confirmation exactly.
    const name = item.desc || item.sub || 'this item';
    Alert.alert(
      `Delete "${name}"?`,
      'This will permanently remove this item from the current list. Other lists are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Item', style: 'destructive', onPress: onDelete },
      ],
    );
  }, [item.desc, item.sub, onDelete]);

  // D-41: localWt is in display units (oz or g) — must convert to oz before multiplying qty
  const totalOz   = calcTotalOz(displayToOz(localWt), localQty);
  const totalLabel = formatDisplayWeight(totalOz, weightUnit);

  const currentLocName = locations.find(l => l.id === item.locationId)?.name ?? 'No location';

  return (
    <View style={styles.panel}>
      {/* Row 1: Name — v3 §6.4: left icon size=14, color MUTED. Lucide Pencil → Ionicons pencil-outline. */}
      <View style={styles.row}>
        <Ionicons name="pencil-outline" size={14} color={MUTED} style={{ flexShrink: 0 }} />
        <Text style={styles.rowLabel}>Name</Text>
        <TextInput
          ref={nameRef}
          style={styles.nameInput}
          value={localName}
          onChangeText={setLocalName}
          onBlur={commitName}
          onSubmitEditing={commitName}
          placeholder="Item name"
          placeholderTextColor="rgba(0,0,0,0.28)"
          returnKeyType="done"
          autoCapitalize="words"
          selectTextOnFocus
        />
      </View>

      <View style={styles.rowDivider} />

      {/* Row 2: Weight — v3 §6.4: Lucide Hash → Ionicons barbell-outline (weight field). Documented translation. */}
      <View style={styles.row}>
        <Ionicons name="barbell-outline" size={14} color={MUTED} style={{ flexShrink: 0 }} />
        <Text style={styles.rowLabel}>Weight</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={styles.weightInput}
            value={localWt}
            onChangeText={setLocalWt}
            onBlur={commitWeight}
            onSubmitEditing={commitWeight}
            placeholder="0"
            placeholderTextColor="rgba(0,0,0,0.28)"
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <Text style={styles.weightUnit}>{weightUnit === 'metric' ? 'g' : 'oz'}</Text>
        </View>
      </View>

      <View style={styles.rowDivider} />

      {/* Row 3: Quantity — v3 §6.4: Lucide PackageOpen → Ionicons cube-outline. Documented translation. */}
      <View style={styles.row}>
        <Ionicons name="cube-outline" size={14} color={MUTED} style={{ flexShrink: 0 }} />
        <Text style={styles.rowLabel}>Quantity</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => adjustQty(-1)}
            disabled={localQty <= 1}
            hitSlop={8}
          >
            <Ionicons name="remove" size={16} color={localQty <= 1 ? 'rgba(0,0,0,0.22)' : NAV_ACTIVE} />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{localQty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => adjustQty(1)}
            disabled={localQty >= 99}
            hitSlop={8}
          >
            <Ionicons name="add" size={16} color={localQty >= 99 ? 'rgba(0,0,0,0.22)' : NAV_ACTIVE} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rowDivider} />

      {/* Row 4: Total (read-only) — v3 VF §19: FIXED height=42px, not min-height.
          Self-check: only this row uses a fixed height; all others use minHeight=44. MATCH. */}
      <View style={styles.totalRow}>
        <Ionicons name="checkmark-circle-outline" size={14} color={MUTED} style={{ flexShrink: 0 }} />
        <Text style={styles.rowLabel}>Total</Text>
        <Text style={styles.totalValue}>{totalLabel}</Text>
      </View>

      <View style={styles.rowDivider} />

      {/* Row 5: Move — v3 §6.4: Lucide ArrowRightLeft → Ionicons swap-horizontal-outline. Documented translation. */}
      <TouchableOpacity style={styles.row} onPress={handleMove} activeOpacity={0.65}>
        <Ionicons name="swap-horizontal-outline" size={14} color={MUTED} style={{ flexShrink: 0 }} />
        <Text style={styles.rowLabel}>Move</Text>
        <View style={styles.rowRight}>
          <Text style={styles.rowValue}>{category}</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.25)" />
        </View>
      </TouchableOpacity>

      <View style={styles.rowDivider} />

      {/* Row 6: Location — v3 §6.4: Lucide MapPin → Ionicons location-outline. Documented translation. */}
      <TouchableOpacity style={styles.row} onPress={handleLocation} activeOpacity={0.65}>
        <Ionicons name="location-outline" size={14} color={MUTED} style={{ flexShrink: 0 }} />
        <Text style={styles.rowLabel}>Location</Text>
        <View style={styles.rowRight}>
          <Text style={[styles.rowValue, !item.locationId && { color: MUTED }]}>
            {currentLocName}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.25)" />
        </View>
      </TouchableOpacity>

      <View style={styles.rowDivider} />

      {/* Row 7: Photo — v3 §6.4: Lucide Camera → Ionicons camera-outline. Documented translation. */}
      <View style={styles.row}>
        <Ionicons name="camera-outline" size={14} color={MUTED} style={{ flexShrink: 0 }} />
        <Text style={styles.rowLabel}>Photo</Text>
        <View style={styles.photoActions}>
          {item.photoDataUrl ? (
            <>
              <TouchableOpacity style={styles.photoBtn} onPress={() => setShowViewer(v => !v)}>
                <Text style={styles.photoBtnText}>{showViewer ? 'Hide Photo' : 'View Photo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={onPhoto}>
                <Text style={styles.photoBtnText}>Edit Photo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.photoBtn, styles.photoAddBtn]} onPress={onPhoto}>
              <Ionicons name="camera-outline" size={14} color={NAV_ACTIVE} />
              <Text style={styles.photoAddBtnText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Row 8: Inline photo viewer — N-03: only shown when View Photo is toggled on */}
      {showViewer && !!item.photoDataUrl && (
        <>
          <View style={styles.rowDivider} />
          <View style={styles.photoViewerRow}>
            <Image
              source={{ uri: item.photoDataUrl }}
              style={styles.photoViewer}
              resizeMode="contain"
            />
          </View>
        </>
      )}

      <View style={styles.rowDivider} />

      {/* Row 9: Delete Item */}
      <TouchableOpacity style={styles.deleteRow} onPress={handleDelete} activeOpacity={0.65}>
        <Ionicons name="trash-outline" size={16} color={DELETE_RED} />
        <Text style={styles.deleteText}>Delete Item</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    backgroundColor: DETAIL_BG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.09)',
  },
  // v3 VF §9: "Padding: 0 34px 0 14px; min-height=44; gap=10" — paddingLeft=14, paddingRight=34, gap=10.
  // Item 31: gap:10 replaces the old fixed 82px label column (gap is the v3 row formula).
  // Self-check: prior paddingHorizontal=16 was wrong on both sides; label width:82 was not in spec. MATCH after fix.
  row: {
    flexDirection: 'row', alignItems: 'center',
    minHeight: 44, paddingLeft: 14, paddingRight: 34, paddingVertical: 6, gap: 10,
  },
  rowDivider: { height: 1, backgroundColor: DIVIDER, marginLeft: 14 },
  rowLabel: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: MUTED,
    flexShrink: 0,
  },
  nameInput: {
    flex: 1, fontSize: 14.5, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT,
    borderBottomWidth: 1.5, borderBottomColor: NAV_ACTIVE,
    paddingVertical: 2, paddingHorizontal: 0, minHeight: 32,
  },
  weightRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  weightInput: {
    width: 72, fontSize: 14.5, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT,
    borderBottomWidth: 1.5, borderBottomColor: NAV_ACTIVE,
    paddingVertical: 2, textAlign: 'right', minHeight: 32,
  },
  weightUnit: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: MUTED },
  qtyRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyValue: { fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: PRIMARY_TEXT, minWidth: 24, textAlign: 'center' },
  // v3 VF §19: Total row has fixed height=42 (the ONLY row that is not min-height).
  // Item 31: gap:10 applied for consistency with the row formula (VF §9).
  // Self-check: all other rows use minHeight: 44. Total is the lone exception. MATCH.
  totalRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 42, paddingLeft: 14, paddingRight: 34, paddingVertical: 6, gap: 10,
  },
  totalValue: { flex: 1, textAlign: 'right', fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: NAV_ACTIVE },
  rowRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  rowValue: { fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT, maxWidth: 180, textAlign: 'right' },
  photoActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  photoBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7,
    borderWidth: 1, borderColor: 'rgba(42,87,64,0.28)',
    backgroundColor: 'rgba(42,87,64,0.06)',
  },
  photoBtnText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: NAV_ACTIVE },
  // Item 23: v3 VF §9 "Add Photo button: fontSize=11.5, min-height=36" — was fontSize:12.5, no minHeight.
  photoAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 36 },
  photoAddBtnText: { fontSize: 11.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: NAV_ACTIVE },
  // v3 VF §9: "max-height=300px; object-fit=contain; background=#111"
  // Self-check: prior height=160 wrong; cover wrong; no dark bg wrong. All three fixed.
  // RN translation note: height:300 is the correct equivalent of CSS max-height:300px for a
  // fixed-height image viewer. resizeMode="contain" letterboxes inside the #111 container. MATCH.
  photoViewerRow: { backgroundColor: '#111111' },
  photoViewer: { width: '100%', height: 300, borderRadius: 0 },
  // Item 25: v3 VF §9 all detail rows use min-height=44 (Total is the only exception at fixed 42).
  // Was minHeight:48, paddingVertical:12 — too tall. MATCH after fix.
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, minHeight: 44, paddingVertical: 6,
    borderTopWidth: 1, borderTopColor: 'rgba(176,58,46,0.15)',
  },
  deleteText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: DELETE_RED },
});
