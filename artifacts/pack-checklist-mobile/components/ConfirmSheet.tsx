/**
 * ConfirmSheet — v3 §13 confirm-dialog bottom-sheet (shared pattern)
 *
 * VF §13 confirm dialog spec:
 *   Sheet: bg #FFFFFF; border-radius 16px 16px 0 0; box-shadow 0 -4px 32px rgba(0,0,0,0.18)
 *   Padding: 24 top / 20 horizontal / (36 + safe-area) bottom (.tw-sa-36 equivalent)
 *   Backdrop: rgba(0,0,0,0.45)
 *   z-index: 200 per VF §14 ("Save Chooser, Reset Confirm, New List Name, Cat Direct-Edit")
 *
 * Self-check: "Cancel | confirmLabel" buttons are side-by-side (the | separator in §13.10 implies row layout).
 * Cancel: min-height=44, border-radius=10, fontSize=15 (VF §13 cancel spec).
 * Confirm: same dimensions, filled with confirmColor.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── ConfirmSheet ─────────────────────────────────────────────────────────────

interface ConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called when the confirm button is tapped. onClose is called automatically after. */
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  /** Confirm button background — #b45309 amber (Reset) or #dc2626 red (Delete) */
  confirmColor: string;
}

export function ConfirmSheet({
  visible, onClose, onConfirm, title, body, confirmLabel, confirmColor,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(400)).current;

  // Keep modal mounted during exit animation so slide-down plays
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, tension: 220, friction: 24,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 400, duration: 180, useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [visible, slideY]);

  if (!isRendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Backdrop — VF §13: rgba(0,0,0,0.45) */}
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
          activeOpacity={1}
          onPress={onClose}
        />
        {/* Sheet — VF §13: bg #fff; radius 16/16/0/0; shadow 0 -4px 32px rgba(0,0,0,0.18)
            padding 24/20/(36+safeArea)/20 */}
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: 36 + insets.bottom, transform: [{ translateY: slideY }] },
          ]}
        >
          {/* Title — VF §13 name dialog baseline: fontSize=17, fontWeight=700 */}
          <Text style={styles.title}>{title}</Text>

          {/* Body — informational text below the title */}
          <Text style={styles.body}>{body}</Text>

          {/* Buttons — "Cancel | confirmLabel" side-by-side per §13.10 format */}
          <View style={styles.btnRow}>
            {/* Cancel — VF §13: min-height=44, border-radius=10, fontSize=15 */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.65}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            {/* Confirm — same geometry, filled confirmColor */}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmColor }]}
              onPress={() => { onConfirm(); onClose(); }}
              activeOpacity={0.80}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';

const styles = StyleSheet.create({
  // VF §13: backdrop rgba(0,0,0,0.45)
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // VF §13 confirm dialog sheet geometry
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    // border-radius: 16px 16px 0 0 (top corners only)
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    // shadow: 0 -4px 32px rgba(0,0,0,0.18)
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 32,
    shadowOffset: { width: 0, height: -4 }, elevation: 16,
    // padding: 24 top / 20 horizontal — paddingBottom set inline
    paddingTop: 24, paddingHorizontal: 20,
  },

  title: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: PRIMARY_TEXT,
    marginBottom: 8,
  },

  body: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: MUTED,
    lineHeight: 20,
    marginBottom: 20,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // VF §13 cancel: min-height=44, border-radius=10, fontSize=15
  cancelBtn: {
    flex: 1, minHeight: 44, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT,
  },

  confirmBtn: {
    flex: 1, minHeight: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
  },
  confirmText: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFFFFF',
  },
});
