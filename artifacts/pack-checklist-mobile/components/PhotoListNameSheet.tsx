/**
 * PhotoListNameSheet — "Name your Photo List" bottom sheet.
 *
 * Opens when the user taps the Photo List tile in the Add deck's New List card.
 * Matches v3's new-list-name-dialog geometry (padding 24/20/40/20, fontSize=18 title,
 * input border-radius=10 fontSize=15, flex-row Cancel / Create List buttons min-height=44).
 * On confirm calls startNewPhotoList(name) and closes. Cancel returns to the deck.
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
import { usePackData } from '@/context/PackDataContext';

const NAV_ACTIVE = '#2A5740';
const PRIMARY    = '#1A2920';
const MUTED      = '#667270';
const DIVIDER    = 'rgba(0,0,0,0.06)';

interface Props {
  visible:   boolean;
  kind?:     'photo' | 'standard';
  onClose:   () => void;  // Cancel — return to Add deck
  onCreated: (name: string) => void;  // Called after list is created
}

export function PhotoListNameSheet({ visible, kind = 'photo', onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const { startNewPhotoList, startNewList, setListName } = usePackData();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const slideY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
      setTimeout(() => inputRef.current?.focus(), 180);
    } else {
      Animated.timing(slideY, {
        toValue: 500, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible, slideY]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (kind === 'photo') {
      startNewPhotoList(trimmed);
    } else {
      startNewList();
      setListName(trimmed);
    }
    onCreated(trimmed);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} accessible={false} />
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
          {/* Title */}
          <Text style={styles.title}>{kind === 'photo' ? 'Name your Photo List' : 'Name your new list'}</Text>
          <Text style={styles.subtitle}>
            {kind === 'photo'
              ? 'Give this list a name so you can find it later. You can rename it any time.'
              : 'Start with a clean, empty gear list.'}
          </Text>

          {/* Input */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={kind === 'photo' ? 'e.g. Gear Cabinet, Car Boot…' : 'e.g. Weekend Backpacking'}
            placeholderTextColor={MUTED}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            autoCapitalize="words"
            maxLength={80}
          />

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnCreate, !name.trim() && { opacity: 0.38 }]}
              onPress={handleCreate}
              activeOpacity={0.8}
              disabled={!name.trim()}
            >
              <Text style={styles.btnCreateText}>Create List</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DIVIDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  btnCancel: {
    borderWidth: 1,
    borderColor: DIVIDER,
    backgroundColor: '#F5F0E8',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
  btnCreate: {
    backgroundColor: NAV_ACTIVE,
  },
  btnCreateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
