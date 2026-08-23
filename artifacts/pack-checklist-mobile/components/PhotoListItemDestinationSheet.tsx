/**
 * PhotoListItemDestinationSheet — "Where does this item belong?" 2-col grid (state 7).
 *
 * z-index equivalent = 214 in v3. max-height 76vh.
 * Grid: repeat(2, minmax(0, 1fr)) gap=10.
 * Unassigned tile: minHeight=116 dashed border, 36×36 icon pill bg=rgba(42,87,64,0.10),
 *   PackageOpen size=18 color NAV_ACTIVE; "Unassigned" fontSize=14 fontWeight=700;
 *   sub fontSize=11.5 color MUTED.
 * Location tiles: minHeight=116 solid border, photo width=100%/height=66 borderRadius=7;
 *   name fontSize=13 fontWeight=700 marginTop=7.
 *
 * On tap Unassigned: assignPhotoToItem(null) → onAssigned(itemId)
 * On tap location: assignPhotoToItem(locId) → onAssigned(itemId)
 * Back: returns to Assignment sheet.
 */

import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PackLocation, usePackData } from '@/context/PackDataContext';

const NAV_ACTIVE = '#2A5740';
const PRIMARY    = '#1A2920';
const MUTED      = '#667270';
const DIVIDER    = 'rgba(0,0,0,0.06)';

interface Props {
  visible:    boolean;
  locations:  PackLocation[];
  onBack:     () => void;
  onAssigned: (itemId: string) => void;
}

export function PhotoListItemDestinationSheet({ visible, locations, onBack, onAssigned }: Props) {
  const insets = useSafeAreaInsets();
  const { assignPhotoToItem } = usePackData();
  const slideY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
    } else {
      Animated.timing(slideY, { toValue: 600, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, slideY]);

  const handleAssign = (locationId: string | null) => {
    const newItemId = assignPhotoToItem(locationId);
    onAssigned(newItemId);
  };

  if (!visible) return null;

  // Only show locations that have photos (v3 parity — locations without photos not in grid)
  const photoLocations = locations.filter(l => l.photoDataUrl);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onBack}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} onPress={onBack} activeOpacity={1} accessible={false} />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(40, insets.bottom + 20), transform: [{ translateY: slideY }] },
        ]}
      >
        <Text style={styles.title}>Where does this item belong?</Text>
        <Text style={styles.subtitle}>
          Choose a photographed location, or keep it Unassigned for now.
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Unassigned tile */}
          <TouchableOpacity
            style={styles.unassignedTile}
            onPress={() => handleAssign(null)}
            activeOpacity={0.75}
          >
            <View style={styles.unassignedPill}>
              <Ionicons name="archive-outline" size={18} color={NAV_ACTIVE} />
            </View>
            <Text style={styles.unassignedLabel}>Unassigned</Text>
            <Text style={styles.unassignedSub}>Choose a location later</Text>
          </TouchableOpacity>

          {/* Location tiles */}
          {photoLocations.map(loc => (
            <TouchableOpacity
              key={loc.id}
              style={styles.locTile}
              onPress={() => handleAssign(loc.id)}
              activeOpacity={0.75}
            >
              {loc.photoDataUrl ? (
                <Image
                  source={{ uri: loc.photoDataUrl }}
                  style={styles.locPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.locPhoto, styles.locPhotoFallback]}>
                  <Ionicons name="location-outline" size={22} color="rgba(255,255,255,0.7)" />
                </View>
              )}
              <Text style={styles.locName} numberOfLines={2}>{loc.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    maxHeight: '76%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
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
  subtitle: {
    fontSize: 12.5,
    color: MUTED,
    lineHeight: 17,
    marginBottom: 14,
  },
  scroll: {
    flexGrow: 0,
    maxHeight: '70%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 4,
  },
  unassignedTile: {
    width: '47%',
    minHeight: 116,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.18)',
    padding: 10,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    backgroundColor: '#FAFAF9',
  },
  unassignedPill: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  unassignedLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    marginTop: 8,
  },
  unassignedSub: {
    fontSize: 11.5,
    color: MUTED,
    marginTop: 3,
  },
  locTile: {
    width: '47%',
    minHeight: 116,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DIVIDER,
    padding: 8,
    overflow: 'hidden',
    backgroundColor: '#FAFAF9',
  },
  locPhoto: {
    width: '100%',
    height: 66,
    borderRadius: 7,
    backgroundColor: NAV_ACTIVE,
  },
  locPhotoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locName: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
    marginTop: 7,
  },
  backBtn: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#F5F0E8',
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
});
