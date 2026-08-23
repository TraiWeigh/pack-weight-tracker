/**
 * PhotoListItemNameSheet — inline "Name this item" sheet that auto-opens after
 * assignPhotoToItem() completes (native equivalent of v3's auto-focus Name field).
 *
 * v3 opens the item's detail panel with the Name TextInput focused immediately.
 * Native uses a focused bottom sheet for the same UX goal: immediate name entry
 * without requiring full item detail panel implementation.
 *
 * Shows after item assignment. User types a name, taps Done (or submits Enter).
 * Skippable with "Skip for now" — the item will be named "Unnamed item".
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePackData, PHOTO_ITEMS_CATEGORY } from '@/context/PackDataContext';

const NAV_ACTIVE = '#2A5740';
const PRIMARY    = '#1A2920';
const MUTED      = '#667270';
const DIVIDER    = 'rgba(0,0,0,0.06)';

interface Props {
  visible:  boolean;
  itemId:   string | null;
  onClose:  () => void;
}

export function PhotoListItemNameSheet({ visible, itemId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { renameItem } = usePackData();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);
  const slideY   = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      Animated.timing(slideY, { toValue: 500, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, slideY]);

  const handleSave = () => {
    if (itemId && name.trim()) {
      renameItem(PHOTO_ITEMS_CATEGORY, itemId, name.trim());
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleSave}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} onPress={handleSave} activeOpacity={1} accessible={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(40, insets.bottom + 20), transform: [{ translateY: slideY }] },
          ]}
        >
          {/* Icon badge */}
          <View style={styles.iconBadge}>
            <Ionicons name="create-outline" size={22} color={NAV_ACTIVE} />
          </View>

          <Text style={styles.title}>Name this item</Text>
          <Text style={styles.subtitle}>
            What gear is shown in this photo? You can add weight and details anytime.
          </Text>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Item name…"
            placeholderTextColor={MUTED}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            autoCapitalize="words"
            maxLength={80}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnSkip]} onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.btnSkipText}>Skip for now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSave, !name.trim() && styles.btnSaveDim]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSaveText}>
                {name.trim() ? 'Save Name' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kavWrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    minHeight: 46,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: NAV_ACTIVE,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 15,
    color: PRIMARY,
    backgroundColor: '#FAFAF9',
    marginBottom: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSkip: {
    borderWidth: 1,
    borderColor: DIVIDER,
    backgroundColor: '#F5F0E8',
  },
  btnSkipText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
  },
  btnSave: {
    backgroundColor: NAV_ACTIVE,
  },
  btnSaveDim: {
    opacity: 0.65,
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
