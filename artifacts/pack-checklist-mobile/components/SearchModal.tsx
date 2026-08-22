/**
 * SearchModal — v3 "Search" deck ported to a native pageSheet modal.
 *
 * v3 reference: Search deck filters items by text; results are interactive (toggle checked);
 * grouped by category. Native equivalent: pageSheet with autofocused TextInput + filtered list.
 *
 * Empty query shows a "Start typing…" prompt matching v3 search deck default state.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePackData, CATEGORY_ORDER, GearItem } from '@/context/PackDataContext';
import { calcTotalOz, ozToLbs } from '@/lib/weightUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE  = '#2A5740';
const CB_CHECKED  = '#4E7D5C';

// ─── SearchModal ──────────────────────────────────────────────────────────────

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ResultSection {
  title: string;
  data: GearItem[];
}

export function SearchModal({ visible, onClose }: SearchModalProps) {
  const insets = useSafeAreaInsets();
  const { data, toggleItem } = usePackData();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');

  // Autofocus and reset on open
  useEffect(() => {
    if (visible) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [visible]);

  // ── Filtered results, grouped by category ─────────────────────────────────

  const sections: ResultSection[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: ResultSection[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = (data[cat] || []).filter(item => {
        const name = (item.desc || item.sub || '').toLowerCase();
        return name.includes(q);
      });
      if (items.length > 0) results.push({ title: cat, data: items });
    }
    return results;
  }, [query, data]);

  const totalResults = sections.reduce((n, s) => n + s.data.length, 0);

  // ── Toggle with haptic ────────────────────────────────────────────────────

  const handleToggle = useCallback((cat: string, id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleItem(cat, id);
  }, [toggleItem]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top + 8 }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Search input row */}
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search items…"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Result count */}
        {query.trim().length > 0 && (
          <Text style={styles.resultCount}>
            {totalResults === 0
              ? 'No results'
              : `${totalResults} item${totalResults !== 1 ? 's' : ''}`}
          </Text>
        )}

        {/* Results or empty hint */}
        {query.trim().length === 0 ? (
          <View style={styles.emptyHint}>
            <Ionicons name="search-outline" size={36} color="#D1D5DB" />
            <Text style={styles.emptyHintText}>Type to search your gear</Text>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>No items match "{query}"</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item, section }) => (
              <SearchResultRow
                item={item}
                category={section.title}
                onToggle={handleToggle}
              />
            )}
            ItemSeparatorComponent={() => (
              <View style={styles.separator} />
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── SearchResultRow ──────────────────────────────────────────────────────────

function SearchResultRow({
  item,
  category,
  onToggle,
}: {
  item: GearItem;
  category: string;
  onToggle: (cat: string, id: string) => void;
}) {
  const oz  = calcTotalOz(item.weightOz, item.qty);
  const lbs = ozToLbs(oz);

  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={() => onToggle(category, item.id)}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <View style={[styles.cb, item.checked && styles.cbChecked]}>
        {item.checked && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>

      {/* Name + weight */}
      <View style={styles.resultMeta}>
        <Text
          style={[styles.resultName, item.checked && styles.resultNameChecked]}
          numberOfLines={1}
        >
          {item.desc || item.sub}
        </Text>
        <Text style={styles.resultWeight}>
          {oz.toFixed(1)} oz
          {item.qty > 1 ? ` × ${item.qty}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
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
    marginTop: 0,
    marginBottom: 8,
  },

  // ── Input row ───────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: { marginRight: 6 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#111827',
    height: 42,
  },
  cancelBtn: { paddingVertical: 8 },
  cancelText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: NAV_ACTIVE,
  },

  // ── Result count ─────────────────────────────────────────────────────────
  resultCount: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  // ── Empty ────────────────────────────────────────────────────────────────
  emptyHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  emptyHintText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // ── List ─────────────────────────────────────────────────────────────────
  listContent: { paddingTop: 4 },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginLeft: 56,
  },

  // ── Result row ────────────────────────────────────────────────────────────
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 52,
  },
  cb: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cbChecked: {
    backgroundColor: CB_CHECKED,
    borderColor: CB_CHECKED,
  },
  resultMeta: { flex: 1, gap: 2 },
  resultName: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#111827',
  },
  resultNameChecked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  resultWeight: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
  },
});
