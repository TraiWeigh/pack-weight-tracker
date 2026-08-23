/**
 * PhotoListLocationNameSheet — "Name this location" form (state 5).
 *
 * z-index equivalent = 214 in v3.
 * Geometry: title fontSize=17 fontWeight=700; body fontSize=13 lineHeight=1.45;
 * input minHeight=46 borderRadius=9 border 1px padding=8/11 fontSize=15;
 * buttons flex-row gap=10 marginTop=14 flex:1 each; Save Location bg=NAV_ACTIVE.
 * autoFocus on input when visible.
 *
 * On save: calls addLocation(name, photoDataUrl) → clears pending capture →
 * calls onSaved(locationId) so parent can switch to Location view.
 * Back: returns to Assignment sheet.
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
  visible:      boolean;
  photoDataUrl: string | null;
  onBack:       () => void;
  onSaved:      (locationId: string) => void;
}

export function PhotoListLocationNameSheet({ visible, photoDataUrl, onBack, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { addLocation } = usePackData();
  const [locName, setLocName] = useState('');
  const inputRef = useRef<TextInput>(null);
  const slideY   = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      setLocName('');
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      Animated.timing(slideY, { toValue: 500, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, slideY]);

  const handleSave = () => {
    const trimmed = locName.trim();
    if (!trimmed) return;
    const id = addLocation(trimmed, photoDataUrl || '');
    onSaved(id);
  };

  if (!visible) return null;

  const canSave = locName.trim().length > 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onBack}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} onPress={onBack} activeOpacity={1} accessible={false} />
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
          <Text style={styles.title}>Name this location</Text>
          <Text style={styles.body}>
            This photo becomes a visual destination before any items are placed there.
          </Text>

          <TextInput
            ref={inputRef}
            style={[styles.input, canSave && styles.inputFocused]}
            value={locName}
            onChangeText={setLocName}
            placeholder="Location name…"
            placeholderTextColor={MUTED}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            autoCapitalize="words"
            maxLength={60}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnBack]} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.btnBackText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSave, !canSave && styles.btnSaveDim]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSaveText}>Save Location</Text>
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
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    minHeight: 46,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: DIVIDER,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 15,
    color: PRIMARY,
    backgroundColor: '#FAFAF9',
    marginBottom: 14,
  },
  inputFocused: {
    borderColor: NAV_ACTIVE,
    borderWidth: 1.5,
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
  btnBack: {
    borderWidth: 1,
    borderColor: DIVIDER,
    backgroundColor: '#F5F0E8',
  },
  btnBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
  btnSave: {
    backgroundColor: NAV_ACTIVE,
  },
  btnSaveDim: {
    opacity: 0.45,
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
