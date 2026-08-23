/**
 * AddDeck.tsx — 4-card Add deck, native port of v3 addCards
 *
 * v3 source: MobileFunctionalV3.tsx addCards (lines 3926–4080)
 *
 * Cards (exact match):
 *   1. Add Item      — list of categories; tap one → blank item added + deck closes
 *   2. Add Category  — TextInput + Add button → addCategory → deck closes
 *   3. Scan / Import — button → document import (coming soon for mobile)
 *   4. New List      — Standard List | Photo List tiles
 *                      Standard → confirmation alert → startNewList
 *                      Photo    → PhotoListNameSheet → startNewPhotoList
 *
 * Interaction model (matches v3 DeckInactiveCard):
 *   - Tapping a card's header row expands/collapses it (accordion; one open at a time)
 *   - Backdrop tap closes the deck
 *   - Close × button in header closes the deck
 *   - Bottom sheet rises from below (spring animation matching v3 CardDeck motion)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePackData } from '@/context/PackDataContext';
import { PhotoListNameSheet } from '@/components/PhotoListNameSheet';

// ─── Design constants (v3 colour system) ─────────────────────────────────────

const NAV_ACTIVE = '#2A5740';
const CARD_BG    = '#FFFFFF';
const DIVIDER    = 'rgba(0,0,0,0.08)';
const PRIMARY    = '#111827';
const SECONDARY  = '#4B5563';
const MUTED      = '#9CA3AF';
const PAGE_BG    = '#F2EDE4';

// ─── Static card descriptors (mirrors v3 addCards id/title/subtitle/icon) ────

const CARDS = [
  {
    id:       'add-item',
    title:    'Add Item',
    subtitle: 'Add a new item to a category',
    icon:     'add-circle-outline' as const,
  },
  {
    id:       'add-category',
    title:    'Add Category',
    subtitle: 'Create a new gear category',
    icon:     'layers-outline' as const,
  },
  {
    id:       'scan-import',
    title:    'Scan / Import',
    subtitle: 'Import gear from a PDF or Word document',
    icon:     'scale-outline' as const,
  },
  {
    id:       'create-list',
    title:    'New List',
    subtitle: 'Start a standard or Photo List',
    icon:     'document-text-outline' as const,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AddDeckProps {
  visible:   boolean;
  onClose:   () => void;
  showToast: (msg: string) => void;
}

// ─── AddDeck ──────────────────────────────────────────────────────────────────

export function AddDeck({ visible, onClose, showToast }: AddDeckProps) {
  const { categoryOrder, addItem, addCategory, startNewList } = usePackData();
  const insets = useSafeAreaInsets();

  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [showPhotoListName, setShowPhotoListName] = useState(false);

  // Bottom-sheet slide animation (matches v3 CardDeck "rise from bottom")
  const translateY = useRef(new Animated.Value(700)).current;

  useEffect(() => {
    if (visible) {
      setActiveCard(null);
      setNewCatName('');
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 700,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // Accordion toggle — only one card open at a time (matches v3 activeCardId)
  const toggleCard = useCallback((id: string) => {
    setActiveCard(prev => (prev === id ? null : id));
  }, []);

  // ── Card 1: Add Item (v3 lines 3937–3963) ───────────────────────────────────
  const handleAddItem = useCallback((cat: string) => {
    addItem(cat, '', 0, 1);
    showToast(`Item added to "${cat}"`);
    onClose();
  }, [addItem, showToast, onClose]);

  // ── Card 2: Add Category (v3 lines 3980–3997) ───────────────────────────────
  const handleAddCategory = useCallback(() => {
    const name = newCatName.trim();
    if (!name) return;
    const ok = addCategory(name);
    if (ok) {
      showToast(`Category "${name}" added`);
      setNewCatName('');
      onClose();
    } else {
      Alert.alert('Duplicate', 'That category name already exists.');
    }
  }, [newCatName, addCategory, showToast, onClose]);

  // ── Card 3: Scan / Import (v3 lines 4021–4031) ──────────────────────────────
  const handleScanImport = useCallback(() => {
    Alert.alert(
      'Scan / Import',
      'Upload a gear list document and TrailWeigh will extract items you can add to your categories.\n\nDocument import is coming soon for mobile.',
      [{ text: 'OK' }],
    );
  }, []);

  // ── Card 4: New List — Standard path ────────────────────────────────────────
  // v3: confirmation → startNewList
  const handleNewStandardList = useCallback(() => {
    Alert.alert(
      'New Standard List',
      'Your current list will be cleared. Save it first if you want to keep it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start New',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            startNewList();
            onClose();
            showToast('New list started');
          },
        },
      ],
    );
  }, [startNewList, onClose, showToast]);

  // ── Card 4: New List — Photo List path ──────────────────────────────────────
  // v3: opens New List Name Dialog then creates Photo List
  const handleNewPhotoList = useCallback(() => {
    // Close the deck first, then show the name sheet
    onClose();
    setTimeout(() => setShowPhotoListName(true), 250);
  }, [onClose]);

  const handlePhotoListCreated = useCallback((name: string) => {
    setShowPhotoListName(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`Photo List "${name}" created`);
  }, [showToast]);

  // ── Expanded content per card ────────────────────────────────────────────────

  const renderContent = (id: string) => {
    switch (id) {
      case 'add-item':
        return (
          <View style={styles.cardContent}>
            <Text style={styles.hint}>Choose a category for the new item:</Text>
            {categoryOrder.length === 0 ? (
              <Text style={styles.empty}>No categories yet — add a category first.</Text>
            ) : (
              categoryOrder.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={styles.catRow}
                  onPress={() => handleAddItem(cat)}
                  activeOpacity={0.65}
                >
                  <Ionicons name="add-circle-outline" size={15} color={NAV_ACTIVE} />
                  <Text style={styles.catRowText}>{cat}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        );

      case 'add-category':
        return (
          <View style={styles.cardContent}>
            <View style={styles.catInputRow}>
              <TextInput
                style={styles.catInput}
                value={newCatName}
                onChangeText={setNewCatName}
                placeholder="Category name…"
                placeholderTextColor={MUTED}
                returnKeyType="done"
                onSubmitEditing={handleAddCategory}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.addBtn, !newCatName.trim() && styles.addBtnDim]}
                onPress={handleAddCategory}
                disabled={!newCatName.trim()}
                activeOpacity={0.75}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'scan-import':
        return (
          <View style={styles.cardContent}>
            <Text style={styles.hint}>
              Upload a gear list document and TrailWeigh will extract items you can add to
              your categories.
            </Text>
            <TouchableOpacity style={styles.importBtn} onPress={handleScanImport} activeOpacity={0.8}>
              <Text style={styles.importBtnText}>Open Scan Gear List</Text>
            </TouchableOpacity>
          </View>
        );

      case 'create-list':
        return (
          <View style={styles.cardContent}>
            <Text style={styles.hint}>Choose the kind of list you want to create:</Text>

            {/* Standard List tile */}
            <TouchableOpacity
              style={styles.listOption}
              onPress={handleNewStandardList}
              activeOpacity={0.8}
              accessibilityLabel="Create a new standard list"
            >
              <View style={[styles.listOptionIcon, { backgroundColor: NAV_ACTIVE }]}>
                <Ionicons name="list-outline" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listOptionTitle}>Standard List</Text>
                <Text style={styles.listOptionSub}>Track items with weights and checkboxes</Text>
              </View>
            </TouchableOpacity>

            {/* Photo List tile — now opens PhotoListNameSheet instead of an Alert */}
            <TouchableOpacity
              style={styles.listOption}
              onPress={handleNewPhotoList}
              activeOpacity={0.8}
              accessibilityLabel="Create a new Photo List"
            >
              <View style={[styles.listOptionIcon, { backgroundColor: '#4E7B5C' }]}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listOptionTitle}>Photo List</Text>
                <Text style={styles.listOptionSub}>Capture photos to build your list visually</Text>
              </View>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (!visible && !showPhotoListName) return null;

  return (
    <>
      {/* ── Main deck sheet ── */}
      {visible && (
        <Modal
          transparent
          visible={visible}
          animationType="none"
          onRequestClose={onClose}
          statusBarTranslucent
        >
          {/* Backdrop — tap to close */}
          <TouchableOpacity
            style={styles.backdrop}
            onPress={onClose}
            activeOpacity={1}
            accessible={false}
          />

          {/* Deck sheet */}
          <Animated.View
            style={[
              styles.deck,
              { paddingBottom: insets.bottom, transform: [{ translateY }] },
            ]}
          >
            {/* ── Header (label + close ×) ── */}
            <View style={styles.deckHeader}>
              <Text style={styles.deckLabel}>Add</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close Add panel"
              >
                <Ionicons name="close" size={22} color={PRIMARY} />
              </TouchableOpacity>
            </View>

            {/* ── Card list (accordion) ── */}
            <ScrollView
              style={styles.scroll}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {CARDS.map((card, idx) => {
                const isActive = activeCard === card.id;
                return (
                  <View key={card.id} style={[styles.cardWrap, idx > 0 && styles.cardTopBorder]}>
                    <TouchableOpacity
                      style={styles.cardBar}
                      onPress={() => toggleCard(card.id)}
                      activeOpacity={0.65}
                      accessibilityRole="button"
                      accessibilityLabel={`${card.title} — ${isActive ? 'collapse' : 'open card'}`}
                    >
                      <View style={styles.cardIconWrap}>
                        <Ionicons name={card.icon} size={18} color={NAV_ACTIVE} />
                      </View>
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                      </View>
                      <Ionicons
                        name={isActive ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={MUTED}
                      />
                    </TouchableOpacity>
                    {isActive && renderContent(card.id)}
                  </View>
                );
              })}
              <View style={{ height: 24 }} />
            </ScrollView>
          </Animated.View>
        </Modal>
      )}

      {/* ── Photo List naming sheet (shown after deck closes) ── */}
      <PhotoListNameSheet
        visible={showPhotoListName}
        onClose={() => setShowPhotoListName(false)}
        onCreated={handlePhotoListCreated}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  deck: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  deckLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
  scroll: { flex: 1 },

  cardWrap:      { backgroundColor: CARD_BG },
  cardTopBorder: { borderTopWidth: 1, borderTopColor: DIVIDER },
  cardBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    minHeight: 60,
  },
  cardIconWrap: {
    width: 32, height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta:     { flex: 1, minWidth: 0 },
  cardTitle:    { fontSize: 14.5, fontWeight: '600', color: PRIMARY },
  cardSubtitle: { fontSize: 11.5, color: MUTED, marginTop: 1 },

  cardContent: { paddingHorizontal: 16, paddingBottom: 14 },
  hint:  { fontSize: 12.5, color: SECONDARY, marginBottom: 8, lineHeight: 18 },
  empty: { fontSize: 13, color: MUTED, paddingVertical: 4 },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  catRowText: { fontSize: 14.5, color: PRIMARY, flex: 1 },

  catInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  catInput: {
    flex: 1,
    fontSize: 14,
    color: PRIMARY,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: PAGE_BG,
  },
  addBtn:    { backgroundColor: NAV_ACTIVE, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, minHeight: 44, justifyContent: 'center' },
  addBtnDim: { backgroundColor: MUTED },
  addBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '600' },

  importBtn:     { width: '100%', backgroundColor: NAV_ACTIVE, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  importBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  listOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listOptionTitle: { fontSize: 14.5, fontWeight: '600', color: PRIMARY },
  listOptionSub:   { fontSize: 12.5, color: SECONDARY, marginTop: 2 },
});
