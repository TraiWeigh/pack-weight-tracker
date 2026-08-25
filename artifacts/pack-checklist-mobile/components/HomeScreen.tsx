import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SUMMARY_BG = '#2A5740';
const NAV_ACTIVE = '#2A5740';
const PRIMARY = '#1A2920';
const MUTED = '#667270';
const PAGE_BG = '#F2EDE4';

const useCases = [
  ['bag-outline', 'Backpacking'], ['airplane-outline', 'Travel'],
  ['bonfire-outline', 'Camping'], ['briefcase-outline', 'Cargo'],
  ['cube-outline', 'Moving'], ['archive-outline', 'Inventory'],
] as const;

type Destination = {
  label: string; subtitle: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'];
  action?: HomeAction; disabled?: boolean;
};

const destinations: Destination[] = [
  { label: 'Start Here', subtitle: 'Build Your Own or let AI help', color: '#2A7A5A', icon: 'add-outline', action: 'start' },
  { label: 'Tutorials', subtitle: 'Learn TrailWeigh', color: '#5C6BC0', icon: 'help-circle-outline', disabled: true },
  { label: 'Controls', subtitle: 'Checklist tools', color: '#7B5D87', icon: 'grid-outline', disabled: true },
  { label: 'My Lists', subtitle: 'Saved checklists', color: '#3B6978', icon: 'folder-outline', action: 'lists' },
  { label: 'Master List', subtitle: 'Full item library', color: '#6B6B3A', icon: 'book-outline', action: 'master' },
  { label: 'Locations', subtitle: 'Pack zones & spots', color: '#1B7A8A', icon: 'location-outline', disabled: true },
  { label: 'Settings', subtitle: 'Preferences & tools', color: '#4A5568', icon: 'options-outline', action: 'settings' },
] as const;

export type HomeAction = 'start' | 'lists' | 'master' | 'settings';

export function HomeScreen({ visible, bottomInset, onAction }: {
  visible: boolean; bottomInset: number; onAction: (action: HomeAction) => void;
}) {
  if (!visible) return null;
  return (
    <View style={[styles.overlay, { bottom: bottomInset }]} testID="home-screen">
      <View style={styles.hero} testID="home-hero">
        <Text style={styles.eyebrow}>TrailWeigh</Text>
        <Text style={styles.title}>Checklist Engine</Text>
        <Text style={styles.subtitle}>Create your own custom checklist or let AI do it for you!</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
        <Text style={styles.sectionLabel}>Built for everything</Text>
        <View style={styles.useCaseGrid}>
          {useCases.map(([icon, label]) => (
            <View key={label} style={styles.useCase}>
              <Ionicons name={icon} size={16} color={NAV_ACTIVE} />
              <Text style={styles.useCaseText}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.destinationList}>
          {destinations.map((destination) => (
            <TouchableOpacity
              key={destination.label}
              disabled={destination.disabled}
              activeOpacity={destination.disabled ? 1 : 0.7}
              style={[styles.destination, destination.disabled && styles.disabled]}
              onPress={() => destination.action && onAction(destination.action)}
              testID={`home-${destination.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <View style={[styles.destinationTile, { backgroundColor: destination.color }]}>
                <Ionicons name={destination.icon} size={24} color="#FFFFFF" />
                <View style={[styles.wedgeTop, { borderLeftColor: destination.color }]} />
                <View style={[styles.wedgeBottom, { borderLeftColor: destination.color }]} />
              </View>
              <View style={styles.destinationText}>
                <Text style={styles.destinationTitle}>{destination.label}</Text>
                <Text style={styles.destinationSubtitle}>{destination.subtitle}</Text>
              </View>
              {destination.disabled && <View style={styles.soonBadge}><Text style={styles.soonText}>Soon</Text></View>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 52, left: 0, right: 0, zIndex: 35, backgroundColor: PAGE_BG, overflow: 'hidden' },
  hero: { flexShrink: 0, backgroundColor: SUMMARY_BG, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28, zIndex: 1, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 7 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.60)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', lineHeight: 29, letterSpacing: -0.3, textTransform: 'uppercase', marginBottom: 10 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 22 },
  scroll: { flex: 1 }, scrollContent: { paddingBottom: 20 },
  sectionLabel: { marginTop: 16, marginHorizontal: 14, marginBottom: 10, fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 0.9, textTransform: 'uppercase' },
  useCaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14 },
  useCase: { width: '48.8%', minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F4F8F5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  useCaseText: { fontSize: 13, fontWeight: '500', color: PRIMARY },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 16, marginBottom: 12 },
  destinationList: { paddingHorizontal: 12, gap: 1 },
  destination: { height: 68, flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  disabled: { opacity: 0.62 },
  destinationTile: { width: 72, alignItems: 'center', justifyContent: 'center' },
  wedgeTop: { position: 'absolute', right: -17, top: 0, width: 0, height: 0, borderTopWidth: 34, borderLeftWidth: 17, borderTopColor: 'transparent' },
  wedgeBottom: { position: 'absolute', right: -17, bottom: 0, width: 0, height: 0, borderBottomWidth: 34, borderLeftWidth: 17, borderBottomColor: 'transparent' },
  destinationText: { flex: 1, justifyContent: 'center', gap: 4, paddingLeft: 30, paddingRight: 8 },
  destinationTitle: { fontSize: 16, fontWeight: '600', color: PRIMARY }, destinationSubtitle: { fontSize: 12.5, color: MUTED },
  soonBadge: { alignSelf: 'center', marginRight: 14, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EEF1EE' },
  soonText: { fontSize: 10.5, fontWeight: '700', color: MUTED },
});
