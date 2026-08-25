/**
 * LockerModal — v3 Locker deck ported to a native pageSheet modal.
 *
 * v3 reference: Locker panel shows saved lists as cards; Save updates the
 * active entry OR auto-creates a new timestamped one; Save As creates a copy;
 * Load replaces current state (undo history cleared).
 *
 * Native implementation: pageSheet with Save / Save As / New List actions at
 * top, then a scrollable list of saved entries. Swipe-to-delete or long-press
 * on an entry row for Rename / Delete.
 *
 * Photo List entries show a "Photo List" badge (Camera icon + label) so they
 * are distinguishable from standard lists (v3 parity: listKind in store).
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePackData, NativeLockerEntry } from '@/context/PackDataContext';
import { ConfirmSheet } from '@/components/ConfirmSheet';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE  = '#2A5740';
const PAGE_BG     = '#F2EDE4';

// ─── LockerModal ──────────────────────────────────────────────────────────────

interface LockerModalProps {
  visible: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;   // F-14
  onNewList: () => void;
}

export function LockerModal({ visible, onClose, showToast, onNewList }: LockerModalProps) {
  const insets = useSafeAreaInsets();
  const {
    listName, lockerEntries, activeLockerEntryId,
    refreshLockerEntries, saveToLocker, saveAsToLocker,
    loadFromLocker, deleteLockerEntry, renameLockerEntry,
  } = usePackData();

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NativeLockerEntry | null>(null);

  // Refresh entries when the sheet opens
  useEffect(() => {
    if (visible) refreshLockerEntries();
  }, [visible, refreshLockerEntries]);

  // ── Save (update or auto-create) ──────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveToLocker();
    await refreshLockerEntries();
    setSaving(false);
  }, [saveToLocker, refreshLockerEntries]);

  // ── Save As ───────────────────────────────────────────────────────────────

  const handleSaveAs = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Save As',
        'Enter a name for this list',
        async (text) => {
          const name = text?.trim();
          if (!name) return;
          setSaving(true);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await saveAsToLocker(name);
          await refreshLockerEntries();
          setSaving(false);
          showToast(`Saved as '${name}'`);
        },
        'plain-text',
        listName,
      );
    } else {
      Alert.alert('Save As', 'Enter a name in the text field above, then tap Save.');
    }
  }, [listName, saveAsToLocker, refreshLockerEntries, showToast]);

  // ── New List ──────────────────────────────────────────────────────────────

  const handleNewList = useCallback(() => {
    onClose();
    setTimeout(onNewList, 250);
  }, [onClose, onNewList]);

  // ── Load entry ────────────────────────────────────────────────────────────

  const handleLoad = useCallback((entry: NativeLockerEntry) => {
    Alert.alert(
      `Load "${entry.name}"`,
      'This will replace your current list. Unsaved changes will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: () => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            loadFromLocker(entry);
            onClose();
            setTimeout(() => showToast(`"${entry.name}" loaded`), 350);  // F-14
          },
        },
      ],
    );
  }, [loadFromLocker, onClose, showToast]);

  // ── Delete entry ──────────────────────────────────────────────────────────

  const handleDelete = useCallback((entry: NativeLockerEntry) => {
    setDeleteTarget(entry);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const entry = deleteTarget;
    if (!entry) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteLockerEntry(entry.id);
    showToast('List deleted');
  }, [deleteTarget, deleteLockerEntry, showToast]);

  // ── Rename entry ──────────────────────────────────────────────────────────

  const handleRename = useCallback((entry: NativeLockerEntry) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename List',
        undefined,
        async (text) => {
          const newName = text?.trim();
          if (!newName || newName === entry.name) return;
          await renameLockerEntry(entry.id, newName);
        },
        'plain-text',
        entry.name,
      );
    } else {
      Alert.alert('Rename', 'Rename is available on iOS only.');
    }
  }, [renameLockerEntry]);

  // ── Entry row actions ─────────────────────────────────────────────────────

  const handleEntryLongPress = useCallback((entry: NativeLockerEntry) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      entry.name,
      undefined,
      [
        { text: 'Rename', onPress: () => handleRename(entry) },
        { text: 'Load',   onPress: () => handleLoad(entry) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(entry) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [handleRename, handleLoad, handleDelete]);

  // ── Render entry ──────────────────────────────────────────────────────────

  const renderEntry = useCallback(({ item }: { item: NativeLockerEntry }) => {
    const isActive    = item.id === activeLockerEntryId;
    const isPhotoList = item.store.listKind === 'photo';
    const date        = new Date(item.savedAt);
    const dateStr     = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr     = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const itemCount   = Object.values(item.store.data).reduce((n, items) => n + items.length, 0);
    const catCount    = item.store.categoryOrder.length;

    return (
      <TouchableOpacity
        style={[styles.entryRow, isActive && styles.entryRowActive]}
        onPress={() => handleLoad(item)}
        onLongPress={() => handleEntryLongPress(item)}
        activeOpacity={0.7}
      >
        {/* Active indicator */}
        {isActive && <View style={styles.activeIndicator} />}

        {/* Folder / Camera icon */}
        <View style={[styles.entryIcon, isActive && styles.entryIconActive, isPhotoList && styles.entryIconPhoto]}>
          <Ionicons
            name={isPhotoList ? 'camera-outline' : 'folder-outline'}
            size={20}
            color={isActive || isPhotoList ? '#fff' : '#6B7280'}
          />
        </View>

        {/* Name + date + stats */}
        <View style={styles.entryMeta}>
          <View style={styles.entryNameRow}>
            <Text style={[styles.entryName, isActive && styles.entryNameActive]} numberOfLines={1}>
              {item.name}
            </Text>
            {/* Photo List badge — v3 parity: listKind displayed in Locker */}
            {isPhotoList && (
              <View style={styles.photoListBadge}>
                <Ionicons name="camera-outline" size={10} color={NAV_ACTIVE} />
                <Text style={styles.photoListBadgeText}>Photo List</Text>
              </View>
            )}
          </View>
          <Text style={styles.entryDate}>{dateStr} · {timeStr}</Text>
          <Text style={styles.entryStats}>
            {itemCount} item{itemCount !== 1 ? 's' : ''} · {catCount} categor{catCount !== 1 ? 'ies' : 'y'}
            {isPhotoList && item.store.locations && item.store.locations.length > 0
              ? ` · ${item.store.locations.length} location${item.store.locations.length !== 1 ? 's' : ''}`
              : ''}
          </Text>
        </View>

        {/* Load button */}
        <TouchableOpacity
          style={[styles.loadBtn, isActive && styles.loadBtnActive]}
          onPress={() => handleLoad(item)}
          hitSlop={8}
        >
          <Text style={[styles.loadBtnText, isActive && styles.loadBtnTextActive]}>
            Load
          </Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [activeLockerEntryId, handleLoad, handleDelete, handleEntryLongPress]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.sheet, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top + 8 }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="folder-outline" size={22} color={NAV_ACTIVE} />
            <Text style={styles.headerTitle}>My Lists</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={16} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.btnSave}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.btnSaveText}>
                  {activeLockerEntryId ? 'Update Saved' : 'Save'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={handleSaveAs}>
            <Ionicons name="copy-outline" size={15} color={NAV_ACTIVE} />
            <Text style={styles.btnSecondaryText}>Save As</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={handleNewList}>
            <Ionicons name="add-outline" size={15} color="#6B7280" />
            <Text style={[styles.btnSecondaryText, { color: '#6B7280' }]}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Saved entries */}
        {lockerEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No saved lists</Text>
            <Text style={styles.emptyBody}>
              Tap <Text style={styles.emptyBold}>Save</Text> to save your current list here.
              Load it back anytime from any device.
            </Text>
          </View>
        ) : (
          <FlatList
            data={lockerEntries}
            keyExtractor={item => item.id}
            renderItem={renderEntry}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          />
        )}
        </View>
      </Modal>
      <ConfirmSheet
        visible={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Saved List?"
        body={deleteTarget
          ? `Delete "${deleteTarget.name}"?\nThis removes the saved list only. Items in your Master Library will not be deleted.`
          : ''}
        confirmLabel="Delete List"
        confirmColor="#dc2626"
        variant="locker-delete"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center',
    marginTop: 0, marginBottom: 8,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.10)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Arial',
    color: '#111827',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    alignItems: 'center',
  },
  btnSave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: NAV_ACTIVE,
    borderRadius: 10,
    paddingVertical: 11,
  },
  btnSaveText: {
    fontSize: 14,
    fontFamily: 'Arial',
    color: '#FFFFFF',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#F9FAFB',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontFamily: 'Arial',
    color: NAV_ACTIVE,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  listContent: { paddingTop: 8 },
  rowSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginLeft: 72,
  },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  entryRowActive: {
    backgroundColor: '#F0F7F3',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
    backgroundColor: NAV_ACTIVE,
    borderRadius: 2,
  },
  entryIcon: {
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  entryIconActive: {
    backgroundColor: NAV_ACTIVE,
  },
  entryIconPhoto: {
    backgroundColor: '#4E7B5C',
  },
  entryMeta: { flex: 1, gap: 2 },
  entryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  entryName: {
    fontSize: 15,
    fontFamily: 'Arial',
    color: '#111827',
    flexShrink: 1,
  },
  entryNameActive: { color: NAV_ACTIVE },

  // Photo List badge — Camera icon + "Photo List" label (v3 parity)
  photoListBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(42,87,64,0.10)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  photoListBadgeText: {
    fontSize: 10,
    fontFamily: 'Arial',
    color: NAV_ACTIVE,
  },

  entryDate: {
    fontSize: 12,
    fontFamily: 'Arial',
    color: '#9CA3AF',
  },
  entryStats: {
    fontSize: 11,
    fontFamily: 'Arial',
    color: '#9CA3AF',
  },
  loadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: NAV_ACTIVE,
  },
  loadBtnActive: {
    backgroundColor: NAV_ACTIVE,
    borderColor: NAV_ACTIVE,
  },
  loadBtnText: {
    fontSize: 13,
    fontFamily: 'Arial',
    color: NAV_ACTIVE,
  },
  loadBtnTextActive: { color: '#FFFFFF' },
  deleteBtn: { padding: 6 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Arial',
    color: '#374151',
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'Arial',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBold: {
    fontFamily: 'Arial',
    color: '#374151',
  },
});
