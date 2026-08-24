/**
 * SearchModal — v3 Search deck ported to a native pageSheet modal.
 *
 * Search is intentionally unavailable in final pre-app v3. Keep the three
 * disabled cards visible and do not expose an active search surface here.
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

// ─── SearchModal ──────────────────────────────────────────────────────────────

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SearchModal({ visible, onClose }: SearchModalProps) {
  const insets = useSafeAreaInsets();

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { paddingTop: insets.top + 8 }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Final v3 Search cards are intentionally disabled. */}
        <Text style={styles.title}>Search</Text>
        <View style={styles.cards}>
          <DisabledSearchCard
            icon="search-outline"
            title="Search Current List"
            subtitle="Not available yet"
          />
          <DisabledSearchCard
            icon="folder-outline"
            title="Search Locker"
            subtitle="Not available yet"
            withTopBorder
          />
          <DisabledSearchCard
            icon="grid-outline"
            title="Search Catalog"
            subtitle="Future feature"
            withTopBorder
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function DisabledSearchCard({
  icon,
  title,
  subtitle,
  withTopBorder,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  withTopBorder?: boolean;
}) {
  return (
    <View
      style={[styles.card, withTopBorder && styles.cardWithTopBorder]}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color="#9CA3AF" />
      </View>
      <View style={styles.cardCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </View>
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

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2920',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cards: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 68,
  },
  cardWithTopBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42,87,64,0.10)',
    marginRight: 12,
    opacity: 0.45,
  },
  cardCopy: { flex: 1, paddingVertical: 8, opacity: 0.5 },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1A2920',
  },
  cardSubtitle: {
    marginTop: 1,
    fontSize: 11.5,
    color: '#4A5D54',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  cancelBtn: { paddingVertical: 8 },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: NAV_ACTIVE,
  },
});
