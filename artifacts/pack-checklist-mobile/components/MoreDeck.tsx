/**
 * MoreDeck — v3 Group 4 "More" 4-card deck
 *
 * Card 1: List Actions — Save, Checklist (v3 §12.5: 2 rows; Save As is in Save Chooser dialog)
 * Card 2: List Settings — Weight unit toggle (imperial / metric)
 * Card 3: Help & TrailWeigh — informational links
 * Card 4: Account & Privacy — links
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Alert, Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { InfoPage } from '@/components/InfoScreen';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const PRIMARY_TEXT = '#1A2920';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.06)'; // content card borders + row separators — VF §2
const HEADER_BDR   = 'rgba(0,0,0,0.07)'; // sheet header bottom border — VF §2

// ─── MoreDeck ─────────────────────────────────────────────────────────────────

interface MoreDeckProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;       // D-48: Save (update current saved entry)
  onSaveAs?: () => void;  // optional — removed from Card 1 per v3 §12.5 (Card 1: Save + Checklist only)
  onOpenChecklist: () => void;
  onOpenInfo: (page: InfoPage) => void;
  weightUnit: 'imperial' | 'metric';
  onSetWeightUnit: (u: 'imperial' | 'metric') => void;
  /** Item 14a/26: when the sheet opens, jump directly to this card (default: 'actions') */
  initialCard?: CardId;
}

type CardId = 'actions' | 'settings' | 'help' | 'account';

const CARD_DEFS: { id: CardId; icon: string; label: string; sub: string }[] = [
  { id: 'actions',  icon: 'list-outline',          label: 'List Actions',      sub: 'Save and trail checklist'              },
  { id: 'settings', icon: 'options-outline',        label: 'List Settings',     sub: ''                                      },
  { id: 'help',     icon: 'help-circle-outline',    label: 'Help & TrailWeigh', sub: 'Guides, about, sources, contact'      },
  { id: 'account',  icon: 'person-circle-outline',  label: 'Account & Privacy', sub: 'Policies and account data'             },
];

export function MoreDeck({
  visible, onClose, onSave, onOpenChecklist, onOpenInfo, weightUnit, onSetWeightUnit, initialCard,
  // onSaveAs intentionally not destructured — removed from Card 1 per v3 §12.5; kept in interface for API compat
}: MoreDeckProps) {
  const insets = useSafeAreaInsets();
  const [openCard, setOpenCard] = useState<CardId | null>(initialCard ?? 'actions');
  const prevVisibleRef = useRef(false);

  // Item 14a/26: reset to initialCard each time the sheet re-opens — v3 §10 Help → Card 3 directly
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setOpenCard(initialCard ?? 'actions');
    }
    prevVisibleRef.current = visible;
  }, [visible, initialCard]);

  const toggleCard = (id: CardId) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenCard(prev => prev === id ? null : id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>More</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} bounces={false}>
          {CARD_DEFS.map(card => (
            <View key={card.id} style={styles.card}>
              {/* Card header bar */}
              <TouchableOpacity
                style={styles.cardBar}
                onPress={() => toggleCard(card.id)}
                activeOpacity={0.72}
              >
                <View style={styles.cardBarIcon}>
                  <Ionicons name={card.icon as any} size={18} color={NAV_ACTIVE} />
                </View>
                <View style={styles.cardBarTextGroup}>
                  <Text style={styles.cardBarLabel}>{card.label}</Text>
                  <Text style={styles.deckRowSub}>
                    {card.id === 'settings'
                      ? `Units: ${weightUnit === 'imperial' ? 'Imperial (lb / oz)' : 'Metric (kg / g)'}`
                      : card.sub}
                  </Text>
                </View>
                <Ionicons
                  name={openCard === card.id ? 'chevron-up' : 'chevron-down'}
                  size={16} color={NAV_INACTIVE}
                />
              </TouchableOpacity>

              {/* Card content */}
              {openCard === card.id && (
                <View style={styles.cardContent}>
                  {card.id === 'actions' && (
                    <>
                      {/* v3 §12.5 Card 1 self-check: exactly 2 rows — Save + Checklist.
                          Prior "Save As…" row (3 rows total) was wrong; Save As belongs in Save Chooser dialog.
                          "Checklist Mode" label → "Checklist"; sub → "Track trail progress separately". MATCH. */}
                      <DeckRow
                        icon="save-outline"
                        label="Save"
                        sub="Update the saved version"
                        onPress={() => { onClose(); setTimeout(onSave, 250); }}
                      />
                      <DeckRow
                        icon="checkmark-circle-outline"
                        label="Checklist"
                        sub="Track trail progress separately"
                        onPress={() => { onClose(); setTimeout(onOpenChecklist, 250); }}
                      />
                    </>
                  )}

                  {card.id === 'settings' && (
                    <View style={styles.settingRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingLabel}>Weight Units</Text>
                        <Text style={styles.settingSub}>Display weights in imperial or metric</Text>
                      </View>
                      <View style={styles.unitToggle}>
                        <TouchableOpacity
                          style={[styles.unitBtn, weightUnit === 'imperial' && styles.unitBtnActive]}
                          onPress={() => onSetWeightUnit('imperial')}
                        >
                          <Text style={[styles.unitBtnText, weightUnit === 'imperial' && styles.unitBtnTextActive]}>
                            Imperial
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.unitBtn, weightUnit === 'metric' && styles.unitBtnActive]}
                          onPress={() => onSetWeightUnit('metric')}
                        >
                          <Text style={[styles.unitBtnText, weightUnit === 'metric' && styles.unitBtnTextActive]}>
                            Metric
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {card.id === 'help' && (
                    <>
                      {/* v3 §12.5 Card 3 self-check: 6 rows — Help, About, How It Works, Sources & References,
                          Report a Problem, Contact. Prior: 4 rows; missing Help/Sources/Contact; had TrailWeigh.com
                          (not in spec); "Report an Issue" → "Report a Problem". MATCH after fix. */}
                      <DeckRow
                        icon="help-circle-outline"
                        label="Help"
                        sub="App guide and FAQs"
                        onPress={() => onOpenInfo('help')}
                      />
                      <DeckRow
                        icon="information-circle-outline"
                        label="About TrailWeigh"
                        sub="Version info and credits"
                        onPress={() => onOpenInfo('about')}
                      />
                      <DeckRow
                        icon="book-outline"
                        label="How It Works"
                        sub="Quick guide to the app"
                        onPress={() => onOpenInfo('how-it-works')}
                      />
                      <DeckRow
                        icon="library-outline"
                        label="Sources & References"
                        sub="Data sources and attributions"
                        onPress={() => onOpenInfo('sources')}
                      />
                      <DeckRow
                        icon="alert-circle-outline"
                        label="Report a Problem"
                        sub="Send feedback"
                        onPress={() => Linking.openURL('mailto:hello@trailweigh.com?subject=TrailWeigh%20Feedback').catch(() =>
                          Linking.openURL('https://trailweigh.com/contact').catch(() => {})
                        )}
                      />
                      <DeckRow
                        icon="mail-outline"
                        label="Contact"
                        sub="Get in touch"
                        onPress={() => Linking.openURL('mailto:hello@trailweigh.com').catch(() =>
                          Linking.openURL('https://trailweigh.com/contact').catch(() => {})
                        )}
                      />
                    </>
                  )}

                  {card.id === 'account' && (
                    <>
                      {/* v3 §12.5 Card 4 self-check: 5 rows. Prior: 3. Added Affiliate Disclosure + Accessibility.
                          "Terms of Service" → "Terms of Use" (exact v3 label). MATCH after fix. */}
                      <DeckRow
                        icon="shield-checkmark-outline"
                        label="Privacy Policy"
                        sub="How we handle your data"
                        onPress={() => Linking.openURL('https://trailweigh.com/privacy').catch(() => {})}
                      />
                      <DeckRow
                        icon="document-text-outline"
                        label="Terms of Use"
                        sub=""
                        onPress={() => Linking.openURL('https://trailweigh.com/terms').catch(() => {})}
                      />
                      <DeckRow
                        icon="trash-outline"
                        label="Delete Account"
                        sub="Permanently remove your data"
                        danger
                        onPress={() => Alert.alert(
                          'Delete Account',
                          'To request account deletion, please visit trailweigh.com or contact hello@trailweigh.com.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Website', onPress: () => Linking.openURL('https://trailweigh.com/delete-account').catch(() => {}) },
                          ],
                        )}
                      />
                      <DeckRow
                        icon="ribbon-outline"
                        label="Affiliate Disclosure"
                        sub="Our affiliate relationships"
                        onPress={() => Linking.openURL('https://trailweigh.com/affiliate').catch(() => {})}
                      />
                      <DeckRow
                        icon="accessibility-outline"
                        label="Accessibility"
                        sub="Accessibility statement"
                        onPress={() => Linking.openURL('https://trailweigh.com/accessibility').catch(() => {})}
                      />
                    </>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── DeckRow ──────────────────────────────────────────────────────────────────

function DeckRow({
  icon, label, sub, danger, onPress,
}: {
  icon: string; label: string; sub?: string; danger?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.deckRow} onPress={onPress} activeOpacity={0.65}>
      <View style={[styles.deckRowIcon, danger && { backgroundColor: 'rgba(176,58,46,0.10)' }]}>
        <Ionicons name={icon as any} size={18} color={danger ? '#B03A2E' : NAV_ACTIVE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.deckRowLabel, danger && { color: '#B03A2E' }]}>{label}</Text>
        {!!sub && <Text style={styles.deckRowSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.2)" />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,28,24,0.45)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: HEADER_BDR,
  },
  sheetTitle: { flex: 1, fontSize: 17, fontFamily: 'Arial', color: PRIMARY_TEXT },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  card: { borderBottomWidth: 1, borderBottomColor: DIVIDER },
  cardBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 68,
  },
  cardBarIcon: {
    width: 32, height: 32, borderRadius: 0, backgroundColor: 'rgba(42,87,64,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBarTextGroup: { flex: 1 },
  cardBarLabel: { fontSize: 15, fontFamily: 'Arial', color: PRIMARY_TEXT },
  cardContent: { backgroundColor: '#FAFAF9', borderTopWidth: 1, borderTopColor: DIVIDER },
  deckRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: DIVIDER,
    minHeight: 52,
  },
  deckRowIcon: {
    width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(42,87,64,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  deckRowLabel: { fontSize: 14, fontFamily: 'Arial', color: PRIMARY_TEXT, marginBottom: 1 },
  deckRowSub: { fontSize: 12, fontFamily: 'Arial', color: MUTED },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 60,
  },
  settingLabel: { fontSize: 14, fontFamily: 'Arial', color: PRIMARY_TEXT, marginBottom: 2 },
  settingSub: { fontSize: 12, fontFamily: 'Arial', color: MUTED },
  unitToggle: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', overflow: 'hidden' },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6' },
  unitBtnActive: { backgroundColor: NAV_ACTIVE },
  unitBtnText: { fontSize: 12, fontFamily: 'Arial', color: MUTED },
  unitBtnTextActive: { color: '#FFFFFF' },
});
