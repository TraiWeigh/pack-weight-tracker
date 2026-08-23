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
const DIVIDER      = 'rgba(0,0,0,0.08)';
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
}

export function ItemDetailPanel({
  item, category, categories, locations, weightUnit,
  onRename, onUpdate, onMove, onDelete, onPhoto, onClose,
}: ItemDetailPanelProps) {
  const nameRef = useRef<TextInput>(null);
  const [localName, setLocalName] = useState(item.desc || item.sub || '');
  const [localWt,   setLocalWt  ] = useState(item.weightOz > 0 ? String(item.weightOz) : '');
  const [localQty,  setLocalQty ] = useState(item.qty);

  // Sync back if item changes externally
  useEffect(() => {
    setLocalName(item.desc || item.sub || '');
    setLocalWt(item.weightOz > 0 ? String(item.weightOz) : '');
    setLocalQty(item.qty);
  }, [item.id]);

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
    const oz = parseFloat(localWt) || 0;
    if (oz !== item.weightOz) {
      onUpdate({ weightOz: Math.max(0, oz) });
    }
  }, [localWt, item.weightOz, onUpdate]);

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

  const handleLocation = useCallback(() => {
    const locOptions = [
      { label: 'No Location', value: null as string | null },
      ...locations.map(l => ({ label: l.name, value: l.id as string | null })),
    ];
    if (Platform.OS === 'ios') {
      const labels = locOptions.map(o => o.label);
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...labels, 'Cancel'], cancelButtonIndex: labels.length, title: 'Assign Location' },
        (idx) => {
          if (idx < locOptions.length) {
            onUpdate({ locationId: locOptions[idx].value || undefined });
          }
        },
      );
    } else {
      Alert.alert('Assign Location', undefined, [
        ...locOptions.map(o => ({
          text: o.label,
          onPress: () => onUpdate({ locationId: o.value || undefined }),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [locations, onUpdate]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.desc || item.sub || 'this item'}" from your list? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Item', style: 'destructive', onPress: onDelete },
      ],
    );
  }, [item.desc, item.sub, onDelete]);

  const totalOz   = calcTotalOz(
    parseFloat(localWt) || 0,
    localQty,
  );
  const totalLabel = formatDisplayWeight(totalOz, weightUnit);

  const currentLocName = locations.find(l => l.id === item.locationId)?.name ?? 'No location';

  return (
    <View style={styles.panel}>
      {/* Row 1: Name */}
      <View style={styles.row}>
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

      {/* Row 2: Weight */}
      <View style={styles.row}>
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
          <Text style={styles.weightUnit}>oz</Text>
        </View>
      </View>

      <View style={styles.rowDivider} />

      {/* Row 3: Quantity */}
      <View style={styles.row}>
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

      {/* Row 4: Total (read-only) */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Total</Text>
        <Text style={styles.totalValue}>{totalLabel}</Text>
      </View>

      <View style={styles.rowDivider} />

      {/* Row 5: Move */}
      <TouchableOpacity style={styles.row} onPress={handleMove} activeOpacity={0.65}>
        <Text style={styles.rowLabel}>Move</Text>
        <View style={styles.rowRight}>
          <Text style={styles.rowValue}>{category}</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.25)" />
        </View>
      </TouchableOpacity>

      <View style={styles.rowDivider} />

      {/* Row 6: Location */}
      <TouchableOpacity style={styles.row} onPress={handleLocation} activeOpacity={0.65}>
        <Text style={styles.rowLabel}>Location</Text>
        <View style={styles.rowRight}>
          <Text style={[styles.rowValue, !item.locationId && { color: MUTED }]}>
            {currentLocName}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.25)" />
        </View>
      </TouchableOpacity>

      <View style={styles.rowDivider} />

      {/* Row 7: Photo */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Photo</Text>
        <View style={styles.photoActions}>
          {item.photoDataUrl ? (
            <>
              <TouchableOpacity style={styles.photoBtn} onPress={onPhoto}>
                <Text style={styles.photoBtnText}>View Photo</Text>
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

      {/* Row 8: Inline photo viewer */}
      {!!item.photoDataUrl && (
        <>
          <View style={styles.rowDivider} />
          <View style={styles.photoViewerRow}>
            <Image
              source={{ uri: item.photoDataUrl }}
              style={styles.photoViewer}
              resizeMode="cover"
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
  row: {
    flexDirection: 'row', alignItems: 'center',
    minHeight: 44, paddingHorizontal: 16, paddingVertical: 6,
  },
  rowDivider: { height: 1, backgroundColor: DIVIDER, marginLeft: 16 },
  rowLabel: {
    width: 82, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: MUTED,
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
  photoAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoAddBtnText: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_600SemiBold', color: NAV_ACTIVE },
  photoViewerRow: { paddingHorizontal: 16, paddingVertical: 10 },
  photoViewer: { width: '100%', height: 160, borderRadius: 10 },
  deleteRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, minHeight: 48, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(176,58,46,0.15)',
  },
  deleteText: { fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: DELETE_RED },
});
