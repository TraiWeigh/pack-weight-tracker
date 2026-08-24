/**
 * SearchModal — v3 "Search" deck ported to a native pageSheet modal.
 *
 * Final v3 reference: Search is a disabled three-card deck. There is no active
 * search input, filtering, result toggling, or search-result haptic behavior.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE  = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const MUTED = '#667270';
const CB_CHECKED = '#4E7D5C';

// ─── SearchModal ──────────────────────────────────────────────────────────────

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SearchModal({ visible, onClose }: SearchModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="search-outline" size={18} color={NAV_ACTIVE} />
          </View>
          <Text style={styles.title}>Search</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardList}>
          <SearchDisabledCard
            icon="list-outline"
            title="Search Current List"
            subtitle="Not available yet"
          />
          <SearchDisabledCard
            icon="folder-outline"
            title="Search Locker"
            subtitle="Not available yet"
          />
          <SearchDisabledCard
            icon="grid-outline"
            title="Search Catalog"
            subtitle="Future feature"
          />
        </View>
      </View>
    </Modal>
  );
}

function SearchDisabledCard({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <TouchableOpacity
      style={styles.disabledCard}
      disabled
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
    >
      <View style={styles.cardIcon}>
        <Ionicons name={icon as any} size={19} color={NAV_INACTIVE} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="lock-closed-outline" size={16} color={MUTED} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
  },
  cardList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  disabledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F9FAFB',
    opacity: 0.72,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#374151',
  },
  cardSubtitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: MUTED,
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
