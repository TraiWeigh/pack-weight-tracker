/**
 * AddItemModal — v3 "Add Item" deck ported to a native pageSheet modal.
 *
 * v3 reference: Add deck accordion with name/weight/qty/category fields.
 * Native equivalent: pageSheet modal with TextInput + qty picker + category picker.
 *
 * Caller passes:
 *   visible          — controls Modal visibility
 *   defaultCategory  — pre-selected category (the open category on the list)
 *   onClose          — dismiss callback
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePackData, CATEGORY_ORDER } from '@/context/PackDataContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE  = '#2A5740';
const QTY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

// ─── AddItemModal ─────────────────────────────────────────────────────────────

interface AddItemModalProps {
  visible: boolean;
  defaultCategory: string;
  onClose: () => void;
}

export function AddItemModal({ visible, defaultCategory, onClose }: AddItemModalProps) {
  const insets = useSafeAreaInsets();
  const { addItem } = usePackData();
  const nameRef = useRef<TextInput>(null);

  // Form state
  const [name,     setName]     = useState('');
  const [weightStr, setWeightStr] = useState('');
  const [qty,      setQty]      = useState(1);
  const [category, setCategory] = useState(defaultCategory || CATEGORY_ORDER[0]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setName('');
      setWeightStr('');
      setQty(1);
      setCategory(defaultCategory || CATEGORY_ORDER[0]);
      // Autofocus name input after sheet animates in
      setTimeout(() => nameRef.current?.focus(), 400);
    }
  }, [visible, defaultCategory]);

  const weightOz = parseFloat(weightStr) || 0;
  const canSave  = name.trim().length > 0;

  // ── Save and close ─────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!canSave) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addItem(category, name.trim(), weightOz, qty);
    onClose();
  }, [canSave, addItem, category, name, weightOz, qty, onClose]);

  // ── Save and add another ───────────────────────────────────────────────────

  const handleAddAnother = useCallback(() => {
    if (!canSave) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    addItem(category, name.trim(), weightOz, qty);
    // Reset name + weight, keep category + qty
    setName('');
    setWeightStr('');
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [canSave, addItem, category, name, weightOz, qty]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Add Item</Text>
            <Text style={styles.headerSub}>to {category}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={16} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Item name ──────────────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ITEM NAME</Text>
            <TextInput
              ref={nameRef}
              style={styles.input}
              placeholder="e.g. Trekking Poles"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              autoCorrect={false}
            />
          </View>

          {/* ── Weight ─────────────────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>WEIGHT (oz)</Text>
            <View style={styles.weightRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="0.0"
                placeholderTextColor="#9CA3AF"
                value={weightStr}
                onChangeText={setWeightStr}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
              <View style={styles.weightUnit}>
                <Text style={styles.weightUnitText}>oz</Text>
              </View>
            </View>
          </View>

          {/* ── Quantity ────────────────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>QUANTITY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.qtyRow}
            >
              {QTY_OPTIONS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qtyCell, qty === q && styles.qtyCellActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync();
                    }
                    setQty(q);
                  }}
                >
                  <Text style={[styles.qtyCellText, qty === q && styles.qtyCellTextActive]}>
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Category ────────────────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
            >
              {CATEGORY_ORDER.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, category === cat && styles.catPillActive]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setCategory(cat);
                  }}
                >
                  <Text
                    style={[styles.catPillText, category === cat && styles.catPillTextActive]}
                    numberOfLines={1}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnSave, !canSave && styles.btnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.btnSaveText}>Add to List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnAnother, !canSave && styles.btnDisabled]}
              onPress={handleAddAnother}
              disabled={!canSave}
            >
              <Ionicons name="add" size={16} color={canSave ? NAV_ACTIVE : '#9CA3AF'} />
              <Text style={[styles.btnAnotherText, !canSave && { color: '#9CA3AF' }]}>
                Add &amp; add another
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.10)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#6B7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  weightRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  weightUnit: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: '#F3F4F6',
  },
  weightUnitText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#374151',
  },
  qtyRow: { gap: 6, paddingVertical: 2 },
  qtyCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCellActive: {
    backgroundColor: NAV_ACTIVE,
    borderColor: NAV_ACTIVE,
  },
  qtyCellText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#374151',
  },
  qtyCellTextActive: { color: '#FFFFFF' },
  catRow: { gap: 8, paddingVertical: 2 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#F9FAFB',
  },
  catPillActive: {
    backgroundColor: NAV_ACTIVE,
    borderColor: NAV_ACTIVE,
  },
  catPillText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#374151',
  },
  catPillTextActive: { color: '#FFFFFF' },
  actions: { gap: 10, marginTop: 4 },
  btnSave: {
    backgroundColor: NAV_ACTIVE,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.38 },
  btnSaveText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  btnAnother: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: NAV_ACTIVE,
  },
  btnAnotherText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: NAV_ACTIVE,
  },
});
