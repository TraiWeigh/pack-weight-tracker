/**
 * HomeOverlay — native equivalent of MobileFunctionalV3's Home screen.
 *
 * The overlay intentionally sits above the still-mounted checklist and below
 * BottomBox. Its hero is outside the only ScrollView so it remains fixed while
 * the destinations beneath it scroll and overscroll.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon } from 'react-native-svg';

const SUMMARY_BG = '#2A5740';
const NAV_ACTIVE = '#2A5740';
const PRIMARY = '#1A2920';
const MUTED = '#667270';
const DIVIDER = 'rgba(0,0,0,0.06)';
const WEDGE_W = 72;
const WEDGE_POINT = 17;
const CARD_H = 68;

type HomeAction = {
  label: string;
  subtitle: string;
  color: string;
  icon: string;
  disabled?: boolean;
  onPress?: () => void;
};

const USE_CASES = [
  ['bag-outline', 'Backpacking'],
  ['airplane-outline', 'Travel'],
  ['bonfire-outline', 'Camping'],
  ['briefcase-outline', 'Cargo'],
  ['cube-outline', 'Moving'],
  ['file-tray-stacked-outline', 'Inventory'],
] as const;

interface HomeOverlayProps {
  top: number;
  bottomInset: number;
  onStartHere: () => void;
  onMyLists: () => void;
  onMasterList: () => void;
  onSettings: () => void;
}

function DestinationBar({ action }: { action: HomeAction }) {
  return (
    <View style={[styles.destinationShadow, action.disabled && styles.destinationDisabled]}>
      <TouchableOpacity
        accessibilityLabel={action.disabled ? `${action.label} — coming soon` : action.label}
        accessibilityState={{ disabled: !!action.disabled }}
        activeOpacity={action.disabled ? 1 : 0.72}
        disabled={action.disabled}
        onPress={action.onPress}
        style={styles.destination}
      >
        <View style={styles.wedge}>
          <View style={[styles.wedgeBase, { backgroundColor: action.color }]}>
            <Ionicons name={action.icon as any} size={26} color="rgba(255,255,255,0.93)" />
          </View>
          <Svg width={WEDGE_POINT} height={CARD_H} style={styles.wedgeTip}>
            <Polygon points={`0,0 ${WEDGE_POINT},${CARD_H / 2} 0,${CARD_H}`} fill={action.color} />
          </Svg>
        </View>
        <View style={styles.destinationContent}>
          <View style={styles.destinationText}>
            <Text style={styles.destinationTitle} numberOfLines={1}>{action.label}</Text>
            <Text style={styles.destinationSubtitle} numberOfLines={1}>{action.subtitle}</Text>
          </View>
          {action.disabled ? (
            <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Soon</Text></View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function HomeOverlay({
  top, bottomInset, onStartHere, onMyLists, onMasterList, onSettings,
}: HomeOverlayProps) {
  const destinations: HomeAction[] = [
    { label: 'Start Here', subtitle: 'Build Your Own or let AI help', color: '#2A7A5A', icon: 'add', onPress: onStartHere },
    { label: 'Tutorials', subtitle: 'Learn TrailWeigh', color: '#5C6BC0', icon: 'help-circle-outline', disabled: true },
    { label: 'Controls', subtitle: 'Checklist tools', color: '#7B5D87', icon: 'grid-outline', disabled: true },
    { label: 'My Lists', subtitle: 'Saved checklists', color: '#3B6978', icon: 'folder-outline', onPress: onMyLists },
    { label: 'Master List', subtitle: 'Full item library', color: '#6B6B3A', icon: 'book-outline', onPress: onMasterList },
    { label: 'Locations', subtitle: 'Pack zones & spots', color: '#1B7A8A', icon: 'location-outline', disabled: true },
    { label: 'Settings', subtitle: 'Preferences & tools', color: '#4A5568', icon: 'options-outline', onPress: onSettings },
  ];

  return (
    <View
      accessibilityLabel="TrailWeigh Home"
      style={[styles.overlay, { top }]}
      testID="home-screen"
    >
      <View style={styles.hero} testID="home-hero">
        <Text style={styles.eyebrow}>TrailWeigh</Text>
        <Text style={styles.heroTitle}>Checklist Engine</Text>
        <Text style={styles.heroSubtitle}>Create your own custom checklist or let AI do it for you!</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 58 + bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
        bounces
        overScrollMode="always"
        testID="home-content-scroll"
      >
        <View style={styles.useCases}>
          <Text style={styles.sectionLabel}>Built for everything</Text>
          <View style={styles.useCaseGrid}>
            {USE_CASES.map(([icon, label]) => (
              <View key={label} style={styles.useCase}>
                <Ionicons name={icon as any} size={15} color={NAV_ACTIVE} />
                <Text style={styles.useCaseText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.destinations}>
          {destinations.map((action) => <DestinationBar key={action.label} action={action} />)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 35,
    elevation: 35,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  hero: {
    flexShrink: 0,
    zIndex: 1,
    backgroundColor: SUMMARY_BG,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  eyebrow: {
    marginBottom: 6,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginBottom: 10,
    fontSize: 26,
    lineHeight: 29,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.82)',
  },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
  useCases: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12 },
  sectionLabel: {
    marginBottom: 10,
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: MUTED,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  useCaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  useCase: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#F4F8F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  useCaseText: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY },
  divider: { height: 1, marginTop: 4, marginBottom: 12, backgroundColor: DIVIDER },
  destinations: { paddingHorizontal: 12, gap: 1 },
  destinationShadow: {
    minHeight: CARD_H,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  destinationDisabled: { opacity: 0.62 },
  destination: { minHeight: CARD_H, flexDirection: 'row', backgroundColor: '#FFFFFF' },
  wedge: { width: WEDGE_W, minHeight: CARD_H, flexDirection: 'row', flexShrink: 0 },
  wedgeBase: { width: WEDGE_W - WEDGE_POINT, minHeight: CARD_H, alignItems: 'center', justifyContent: 'center' },
  wedgeTip: { position: 'absolute', right: 0, top: 0 },
  destinationContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  destinationText: { flex: 1, minWidth: 0 },
  destinationTitle: {
    marginBottom: 2,
    fontSize: 17,
    lineHeight: 21,
    fontFamily: 'Georgia',
    fontWeight: '500',
    color: PRIMARY,
    letterSpacing: -0.1,
  },
  destinationSubtitle: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_400Regular', color: MUTED },
  soonBadge: {
    flexShrink: 0,
    borderRadius: 6,
    backgroundColor: 'rgba(42,87,64,0.09)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonBadgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: NAV_ACTIVE,
    letterSpacing: 0.3,
  },
});