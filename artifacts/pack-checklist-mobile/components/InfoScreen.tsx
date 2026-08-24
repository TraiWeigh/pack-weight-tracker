import React, { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PAGE_BG = '#F2EDE4';
const CARD_BG = '#FFFFFF';
const PRIMARY = '#1A2920';
const SECONDARY = '#4A5D54';
const MUTED = '#667270';
const NAV_ACTIVE = '#2A5740';
const DIVIDER = 'rgba(0,0,0,0.06)';

export type InfoPage = 'help' | 'about' | 'how-it-works' | 'sources';

type Section = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type Citation = {
  id: number;
  text: string;
  url?: string;
  note?: string;
};

const HELP_SECTIONS: Section[] = [
  {
    id: 'building',
    title: '1. Building Your Gear List',
    paragraphs: [
      'When you sign in, TrailWeigh opens your current working gear list. To start completely fresh, choose New, save first if you want to keep the current list, then choose Create New List.',
      'If you already have a gear list saved as a file, Scan Gear List can import it instead of requiring you to re-enter everything. Supported file types: PDF (.pdf), Word (.docx, .doc), Excel (.xlsx, .xls), and Numbers (.numbers).',
      'Open Scan Gear List, choose or drop a file, review the gear items and weights TrailWeigh detects, then choose Import Selected. Detection accuracy depends on how the source file is formatted.',
      'Gear is organized into categories. Expand a category, choose Add Item, and enter its type, optional description, weight, and quantity. Check the items you are taking; unchecked items remain in your list but are excluded from the current weight calculation.',
      'Use Move to… to move an item while preserving its details. Categories can be expanded, collapsed, renamed, reordered, added, and deleted. Categories marked + Base contribute to Base Weight; categories marked — Base are shown separately.',
      'Maintain separate named lists for different trips, trails, and seasons, such as PCT — Desert, PCT — Sierra, AT — Summer, AT — Cold Weather, CDT — Colorado, Weekend — Summer, and Weekend — Winter. Save As creates a new version without changing the original.',
    ],
  },
  {
    id: 'weight',
    title: '2. Understanding Your Pack Weight',
    paragraphs: [
      'Base Weight is the total weight of checked gear in categories set to + Base. Non-base categories commonly include food and water, worn clothing, or a dog pack and are shown separately.',
      'Grand Total is the combined weight of all checked items across every category. TrailWeigh multiplies each item weight by its quantity, and unchecked items contribute zero to all totals.',
      'Weight Distribution shows how total checked pack weight is divided across categories. It updates as you check, uncheck, add, or remove items; categories with no checked items do not appear.',
      'Pack Summary shows Base Weight, each non-base category subtotal, and Grand Total for the items selected for the current trip.',
    ],
  },
  {
    id: 'editing',
    title: '3. Editing Your Gear List',
    paragraphs: [
      'Undo reverses the most recent change, such as restoring a deleted item, reversing a renamed category, or undoing a quantity change. Redo reapplies a change reversed by Undo. New edits after Undo clear the redo history.',
      'Open expands all categories, Close collapses all categories, and an individual category name or disclosure control opens or closes that category. Collapsing a category does not affect weight calculations.',
      'Imperial displays ounces and pounds. Metric displays grams and kilograms. Switching units changes display only; the underlying weight is preserved precisely.',
      'Reset removes items from the current working list while keeping the categories and settings. It does not change anything in the Locker.',
    ],
  },
  {
    id: 'save',
    title: '4. Save / Locker',
    paragraphs: [
      'Save stores the current items, weights, checked states, categories, background, and unit preference in the Locker under a name. Save As creates an independent copy for another trip, trail section, or season.',
      'The Locker stores named gear lists privately to your signed-in account. Load opens a saved list, rename changes its name, and delete removes it after confirmation.',
      'Deleting a Locker list does not delete items from the Master Library.',
    ],
  },
  {
    id: 'share',
    title: '5. Preview / Print / Share',
    paragraphs: [
      'Preview opens a clean, formatted view of the current gear list organized by category. Print is available inside Preview and opens the browser print dialog.',
      'Share Link creates a view-only link to saved Locker files. Share Pack List creates a link to the current list as a checkable packing list. Recipient checkbox changes are temporary, and recipients cannot edit, rename, or delete the original lists.',
      'Share links capture the list at the moment they are created. Anyone with the link can view it, so do not share information you want to keep private.',
    ],
  },
  {
    id: 'backgrounds',
    title: '6. Backgrounds & Display',
    paragraphs: [
      'Background Edit lets you choose from the ten built-in Landscapes scenes or create custom themes. Custom photos are stored locally on the device and are not uploaded to a server.',
      'Fill Screen covers the background and may crop its edges. Fit Image shows the complete photo and may leave unused space around it.',
      'Showcase (Hide) removes the gear-list interface while leaving the current list open in the background. Tap, press a key, or move the mouse to return.',
      'Light or Dark tone and the Lighten / Darken slider control how strongly the photo shows through. These settings are saved with the list when it is saved to the Locker.',
    ],
  },
];

const HOW_IT_WORKS_SECTIONS: Section[] = [
  {
    id: 'create',
    title: '1. Create / Upload',
    paragraphs: [
      'There are two ways to get gear into TrailWeigh. Choose whichever fits your situation.',
      'Start from scratch: choose New to open a fresh list and start adding gear manually. You will build the list item by item as you go.',
      'Upload an existing list — Scan Gear List: if you already have a gear list in a PDF, Word document, Excel spreadsheet, or Numbers file, use Scan Gear List to import it. TrailWeigh reads the file and detects the items it finds. You review the detected items and choose which ones to add—nothing is imported automatically.',
      'After the initial import you can add, edit, or remove items at any time.',
    ],
  },
  {
    id: 'organize',
    title: '2. Add / Organize',
    paragraphs: [
      'Once gear is in TrailWeigh, you can build and refine your list however you like.',
      'Adding and editing items: use Add Item inside any category to add gear manually. For each item you can enter a type, description, weight (optional), and quantity (1–20). The item total updates automatically.',
      'Organizing into categories: gear is grouped into categories—Shelter, Clothing, Navigation, or any grouping that makes sense for your trip. You can add categories, rename them, reorder them, and move items between them using the Move control.',
      'Selecting the gear you are taking: check the items you are actually bringing. Only checked items count toward pack weight totals. Unchecked items stay in the list for future trips.',
      'A gear list for one trail or season may differ from another. TrailWeigh supports separate named lists, and Save As creates a new version of an existing list.',
    ],
  },
  {
    id: 'save-share',
    title: '3. Save / Preview / Print / Share',
    paragraphs: [
      'Save stores the current list in the Locker under a name you choose. You can keep separate lists for trails, seasons, gear configurations, or trips.',
      'Preview opens a clean, formatted view of the current gear list and is useful for reviewing it before printing or sharing.',
      'Print turns the completed gear list into a physical packing checklist for gathering equipment, packing with another hiker, or doing a final gear check.',
      'Share lets you share a link to saved lists or just the current list as a checkable packing list. Recipients can view, temporarily check items, and print; their checkbox activity does not affect your original.',
    ],
  },
];

const ABOUT_SECTIONS: Section[] = [
  {
    id: 'why-here',
    title: "Remember Why We're Here",
    paragraphs: [
      'It is surprisingly easy for backpacking to become about gear. We compare ounces, fabrics, shelters, shoes, quilts, stoves, electronics, and base weights. Those things can be useful. They can also become the focus instead of the means.',
      'A lighter pack can make long miles easier, but the number on a scale is not the destination. Gear is a tool. Knowledge is a tool. TrailWeigh is a tool.',
    ],
  },
  {
    id: 'mind',
    title: 'Mind — Mental & Emotional Benefits',
    paragraphs: [
      'Time outside can create room to notice what is happening in the mind. A trail can offer distance from constant demands, space for reflection, and a slower rhythm.',
      'The research summarized in Sources & References describes associations and study results, not guarantees for every individual.',
    ],
    citations: [1, 2, 3],
  } as Section & { citations?: number[] },
  {
    id: 'body',
    title: 'Body — Physical Benefits',
    paragraphs: [
      'Hiking combines movement, time outdoors, changing terrain, and the practical work of carrying what you need. Regular physical activity has well-established health benefits.',
      'TrailWeigh helps you understand the weight you choose to carry; it does not prescribe a particular pack weight or exercise plan.',
    ],
    citations: [4, 5, 6, 7, 8, 9, 10, 11],
  } as Section & { citations?: number[] },
  {
    id: 'spirit',
    title: 'Spirit — Awe, Connection & Meaning',
    paragraphs: [
      'The outdoors can invite awe, connection, gratitude, and a sense of belonging to something larger than ourselves. These experiences are personal and can be expressed in many different traditions.',
      'A lighter, more intentional system can leave more attention for the place, the people, and the experience that brought you outside.',
    ],
    citations: [12, 13, 14, 15, 16, 17],
  } as Section & { citations?: number[] },
  {
    id: 'trail-camp',
    title: 'Do You Hike for the Trail or the Camp?',
    paragraphs: [
      'There is no single correct reason to go outside. Some people love the movement and the miles; others love camp, photography, food, conversation, solitude, or the challenge. The right list supports your reason for being there.',
      'Ask: "Should I carry this?" Then ask what the item allows the rest of your system to do.',
    ],
  },
  {
    id: 'hyoh',
    title: 'Hike Your Own Hike — HYOH',
    paragraphs: [
      'Hike Your Own Hike means that your goals, comfort, experience, route, body, and responsibilities matter. Numbers can be useful reference points, but they are not laws.',
      'Your hike is your own. The trail is shared.',
    ],
  },
  {
    id: 'respect',
    title: 'Respect the Trail—and Each Other',
    paragraphs: [
      'Lightweight choices are personal, but the places we visit and the people we meet are shared. Respect the trail, other hikers, local communities, wildlife, and the limits of your own body.',
      'A gear system is successful when it supports a responsible experience rather than becoming a contest.',
    ],
  },
  {
    id: 'ultralight',
    title: 'What Is Ultralight?',
    paragraphs: [
      'Ultralight is a way of thinking about what you carry: understand the role of each item, remove what does not earn its place, and choose lighter solutions when they still meet your needs.',
      'The useful question is not only "How do I get below a particular number?" but also "Why am I carrying each thing?"',
    ],
  },
  {
    id: 'tool',
    title: 'Ultralight Is a Tool, Not a Contest',
    paragraphs: [
      'Ultralight is a tool, not a contest. A lower number is not automatically better if it makes a trip less safe, less comfortable, or less meaningful.',
    ],
  },
  {
    id: 'minimalist',
    title: 'The Minimalist Mindset',
    paragraphs: [
      'Minimalism is not deprivation. It is making deliberate choices about what deserves space, attention, and maintenance. The goal is not to own the fewest things; it is to carry what supports the experience.',
      'Sometimes the answer to "Is it worth it?" is yes. The point is to make that choice consciously.',
    ],
  },
  {
    id: 'ray-way',
    title: 'Ray-Way',
    paragraphs: [
      'Ray-Way history helped popularize a systems-oriented approach to lightweight backpacking: examine every component, understand how the parts work together, and build around the experience you want.',
      'TrailWeigh references this history for educational context and does not imply affiliation or endorsement.',
    ],
    citations: [22, 23, 24, 25],
  } as Section & { citations?: number[] },
  {
    id: 'knowledge',
    title: 'Knowledge Weighs Nothing',
    paragraphs: [
      'Knowledge can replace unnecessary equipment, prevent duplicated solutions, and help you choose with confidence. Learning the system is one of the lightest improvements available.',
    ],
  },
  {
    id: 'systems',
    title: 'Think in Systems',
    paragraphs: [
      'Ask not only "How much does this item weigh?" Ask "What does this item allow the rest of my system to do?" A shelter, clothing layer, cook system, or repair kit may serve several connected roles.',
    ],
  },
  {
    id: 'one-tool',
    title: 'One Tool, Many Uses',
    paragraphs: [
      'A tool that serves more than one purpose can reduce duplication, but only when it performs each job well enough for your trip. Multi-use is an option, not a rule.',
    ],
  },
  {
    id: 'fits',
    title: 'Where TrailWeigh Fits In',
    paragraphs: [
      'TrailWeigh started as a way to understand and organize pack weight, but it is not limited to backpacking. Build and organize almost any checklist or item list. Add weights when they are useful—or leave them out entirely. Weight is never required.',
      'The tool helps you see the system, make deliberate choices, and keep different configurations organized. It does not tell you what to carry.',
    ],
  },
  {
    id: 'creator',
    title: 'About the Creator',
    paragraphs: [
      'TrailWeigh is an independent project built to make thoughtful gear planning and checklist building easier. It is intended to support the decisions of the person using it.',
    ],
  },
  {
    id: 'credits',
    title: 'Credits',
    paragraphs: [
      'TrailWeigh acknowledges the broader hiking community, the researchers whose work informs the educational material, and the authors, organizations, and historical sources identified in Sources & References.',
      'References to individuals, companies, books, organizations, research institutions, religious or philosophical traditions, products, or other third parties are provided for historical, educational, or citation purposes and do not imply sponsorship, affiliation, or endorsement.',
      'Do I really need to carry this?',
    ],
  },
];

const SOURCES: { title: string; entries: Citation[] }[] = [
  {
    title: 'Mind — Mental & Emotional Benefits',
    entries: [
      { id: 1, text: 'Liu X, Sun Z, Wang X, Dong D, Samsudin SB. “Effects of green exercise on mental health: a systematic review and meta-analysis.” Frontiers in Psychology. 2026;17:1802759. DOI: 10.3389/fpsyg.2026.1802759 · PMID: 42058299.', url: 'https://doi.org/10.3389/fpsyg.2026.1802759', note: 'A systematic review and meta-analysis examining mental-health outcomes from green exercise.' },
      { id: 2, text: 'Bettmann JE, Speelman E, Blumenthal E, Couch S, McArthur T. “How Does Nature Exposure Affect Adults With Symptoms of Mental Illness? A Meta-Analysis.” International Journal of Mental Health Nursing. 2024;33(6):1889–1907. DOI: 10.1111/inm.13400 · PMID: 39209768.', url: 'https://doi.org/10.1111/inm.13400', note: 'A meta-analysis examining nature exposure among adults with symptoms of mental illness.' },
      { id: 3, text: 'Stevenson MP, Schilhab T, Bentsen P. “Attention Restoration Theory II: a systematic review to clarify attention processes affected by exposure to natural environments.” Journal of Toxicology and Environmental Health, Part B. 2018;21(4):227–268. DOI: 10.1080/10937404.2018.1505571 · PMID: 30130463.', url: 'https://doi.org/10.1080/10937404.2018.1505571', note: 'A systematic review examining cognitive domains affected by exposure to natural environments.' },
    ],
  },
  {
    title: 'Body — Physical Benefits',
    entries: [
      { id: 4, text: 'Centers for Disease Control and Prevention. “Health Benefits of Physical Activity for Adults.” cdc.gov.', url: 'https://www.cdc.gov/physical-activity-basics/benefits/index.html', note: 'Authoritative public-health guidance summarizing established health benefits associated with regular physical activity.' },
      { id: 5, text: 'Liu XX, Ma XL, Huang WZ, et al. “Green space and cardiovascular disease: A systematic review with meta-analysis.” Environmental Pollution. 2022;301:118990. DOI: 10.1016/j.envpol.2022.118990 · PMID: 35181451.', url: 'https://doi.org/10.1016/j.envpol.2022.118990' },
      { id: 6, text: '“The Effects of Forest Therapy on the Blood Pressure and Salivary Cortisol Levels of Urban Residents: A Meta-Analysis.” 2023. PMID: 36612777.', url: 'https://pubmed.ncbi.nlm.nih.gov/36612777/' },
      { id: 7, text: 'Antonelli M, Barbieri G, Donelli D. “Effects of forest bathing (shinrin-yoku) on levels of cortisol as a stress biomarker: a systematic review and meta-analysis.” International Journal of Biometeorology. 2019;63(8):1117–1134. DOI: 10.1007/s00484-019-01717-x · PMID: 31001682.', url: 'https://doi.org/10.1007/s00484-019-01717-x' },
      { id: 8, text: 'Shin JC, Parab KV, An R, Grigsby-Toussaint DS. “Greenspace exposure and sleep: A systematic review.” Environmental Research. 2020;182:109081. DOI: 10.1016/j.envres.2019.109081 · PMID: 31891829.', url: 'https://doi.org/10.1016/j.envres.2019.109081' },
      { id: 9, text: 'Zhang YD, Zhou GL, Wang L, et al. “Greenspace and human microbiota: A systematic review.” Environment International. 2024;187:108662. DOI: 10.1016/j.envint.2024.108662 · PMID: 38653130.', url: 'https://doi.org/10.1016/j.envint.2024.108662' },
      { id: 10, text: 'Robinson JM, Breed AC, Camargo A, Redvers N, Breed MF. “Biodiversity and human health: A scoping review and examples of underrepresented linkages.” Environmental Research. 2024;246:118115. DOI: 10.1016/j.envres.2024.118115 · PMID: 38199470.', url: 'https://doi.org/10.1016/j.envres.2024.118115' },
      { id: 11, text: 'Andersen L, Corazon SS, Stigsdotter UK. “Nature Exposure and Its Effects on Immune System Functioning: A Systematic Review.” International Journal of Environmental Research and Public Health. 2021;18(4):1416. DOI: 10.3390/ijerph18041416 · PMID: 33546397.', url: 'https://doi.org/10.3390/ijerph18041416' },
    ],
  },
  {
    title: 'Spirit — Awe, Connection & Meaning',
    entries: [
      { id: 12, text: 'Piff PK, Dietze P, Feinberg M, Stancato DM, Keltner D. “Awe, the small self, and prosocial behavior.” Journal of Personality and Social Psychology. 2015;108(6):883–899. DOI: 10.1037/pspi0000018 · PMID: 25984788.', url: 'https://doi.org/10.1037/pspi0000018' },
      { id: 13, text: 'Sparkman DJ, et al. “No one is an island: Awe encourages global citizenship identification.” Emotion. DOI: 10.1037/emo0001160 · PMID: 36074621.', url: 'https://doi.org/10.1037/emo0001160' },
      { id: 14, text: 'Capaldi CA, Dopko RL, Zelenski JM. “The relationship between nature connectedness and happiness: a meta-analysis.” Frontiers in Psychology. 2014;5:976. DOI: 10.3389/fpsyg.2014.00976 · PMID: 25249992.', url: 'https://doi.org/10.3389/fpsyg.2014.00976' },
      { id: 15, text: 'Whitburn J, Linklater W, Abrahamse W. “Meta-analysis of human connection to nature and proenvironmental behavior.” Conservation Biology. 2020;34(1):180–193. DOI: 10.1111/cobi.13381 · PMID: 31251416.', url: 'https://doi.org/10.1111/cobi.13381' },
      { id: 16, text: 'Barragan-Jason G, de Mazancourt C, Parmesan C, Singer MC, Loreau M. “Human-nature connectedness as a pathway to sustainability: A global meta-analysis.” Conservation Letters. 2022;15(1). DOI: 10.1111/conl.12852 · PMID: 35865265.', url: 'https://doi.org/10.1111/conl.12852' },
      { id: 17, text: 'Christens BD, McCormick ML, Wolf J. “Understanding and promoting nature connectedness: A human ecological perspective.” Current Opinion in Psychology. 2025;65:102046. DOI: 10.1016/j.copsyc.2025.102046 · PMID: 40334530.', url: 'https://doi.org/10.1016/j.copsyc.2025.102046' },
    ],
  },
  {
    title: 'Quotations & Historical Texts',
    entries: [
      { id: 18, text: 'John Muir. My First Summer in the Sierra. 1911, p. 110. Quote: “When we try to pick out anything by itself, we find it hitched to everything else in the Universe.”', url: 'https://archive.org/details/myfirstsummerins00muir_0', note: 'Public domain. Internet Archive and Sierra Club Muir Exhibit.' },
      { id: 19, text: 'Tao Te Ching / Dao De Jing. Chapter 25. James Legge translation, 1891. Quote: “Man takes his law from the Earth; the Earth takes its law from Heaven.”', url: 'https://ctext.org/dao-de-jing', note: 'Legge translation is in the public domain.' },
      { id: 20, text: 'Psalm 24:1. King James Version (public domain). Quote: “The earth is the LORD’s, and the fulness thereof.”' },
      { id: 21, text: 'Karaṇīya Mettā Sutta. Sutta Nipāta 1.8 / Khuddakapāṭha 9. Translation by Acharya Buddharakkhita. Quote: “May all beings be happy!”', url: 'https://www.accesstoinsight.org/tipitaka/kn/snp/snp.1.08.budd.html' },
    ],
  },
  {
    title: 'Ray Jardine / Ray-Way History',
    entries: [
      { id: 22, text: 'Wild Country. “Making Friends Since 1977: The History.”', url: 'https://www.wildcountry.com/en-gb/making-friends-since-1977', note: 'Historical account of Ray Jardine’s aerospace background, Friend prototypes, collaboration with Mark Vallance, and commercial production beginning in 1977.' },
      { id: 23, text: 'Ray Jardine. “Profile of Ray Jardine.”', url: 'https://www.rayjardine.com/ray-way/about-ray/index.htm', note: 'Source for the long-distance hiking chronology, including the five major 1987–1994 hikes totaling approximately 12,500 miles.' },
      { id: 24, text: 'Ray Jardine. “Appalachian Trail hiking adventure, 1993 — Pearl Four.”', url: 'https://www.rayjardine.com/ray-way/AT/Pearl4/index.htm', note: 'Source for Jardine’s description of the sub-10-pound “Baseline Pack Weight”.' },
      { id: 25, text: 'Ray Jardine. “Trail Life’s Publication History.”', url: 'https://www.rayjardine.com/ray-way/Trail-Life/publication-history/index.htm', note: 'Source for PCT Hiker’s Handbook, Beyond Backpacking, and Trail Life publication history.' },
    ],
  },
];

const ABOUT_INTRO = [
  'TrailWeigh is built around a simple idea: what we carry should support why we went outside in the first place. It gives you a place to plan your gear, organize it into a system, and understand where the weight comes from.',
  'A lighter pack can make long miles easier, but the number on a scale is not the destination. Gear is a tool. Knowledge is a tool. TrailWeigh is a tool.',
  'The real goal might be adventure, solitude, challenge, friendship, discovery, healing, a mountaintop sunrise, a quiet camp beside a stream—or simply seeing what is around the next bend.',
  'Carry what you need. Understand why you carry it. Make each item earn its place.',
  'TrailWeigh started as a way to understand and organize pack weight, but it isn’t limited to backpacking. You can use TrailWeigh to build and organize almost any kind of checklist or item list. Add weights when they are useful—or leave them out entirely. Weight is never required.',
];

type SectionWithCitations = Section & { citations?: number[] };

function AccordionSection({
  section,
  isOpen,
  onToggle,
  onCitation,
}: {
  section: SectionWithCitations;
  isOpen: boolean;
  onToggle: () => void;
  onCitation?: (n: number) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        testID={`info-section-${section.id}`}
      >
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={MUTED} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.sectionBody}>
          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.id}-p-${index}`} style={styles.bodyText}>{paragraph}</Text>
          ))}
          {!!section.bullets && section.bullets.map((bullet) => (
            <Text key={bullet} style={styles.bodyText}>• {bullet}</Text>
          ))}
          {!!section.citations && (
            <View style={styles.citationRow}>
              {section.citations.map((n) => (
                <TouchableOpacity key={n} onPress={() => onCitation?.(n)} accessibilityLabel={`Reference ${n}`}>
                  <Text style={styles.citationButton}>[{n}]</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function SourceEntry({
  citation,
}: {
  citation: Citation;
}) {
  const content = (
    <>
      <Text style={styles.sourceText}><Text style={styles.sourceNumber}>[{citation.id}] </Text>{citation.text}</Text>
      {!!citation.note && <Text style={styles.sourceNote}>{citation.note}</Text>}
      {!!citation.url && <Text style={styles.sourceLink}>Open reference</Text>}
    </>
  );

  return citation.url ? (
    <TouchableOpacity
      style={styles.sourceEntry}
      onPress={() => void Linking.openURL(citation.url!)}
      accessibilityRole="link"
      accessibilityLabel={`Open reference ${citation.id}`}
      testID={`source-reference-${citation.id}`}
    >
      {content}
    </TouchableOpacity>
  ) : (
    <View style={styles.sourceEntry}>
      {content}
    </View>
  );
}

function SourcesBody({ scrollToRef }: { scrollToRef?: number | null }) {
  const listRef = useRef<SectionList<Citation>>(null);
  const target = scrollToRef == null
    ? null
    : SOURCES.flatMap((group, sectionIndex) =>
      group.entries.map((entry, itemIndex) => entry.id === scrollToRef ? { sectionIndex, itemIndex } : null)
    ).find((location) => location !== null) ?? null;

  useEffect(() => {
    if (!target) return;
    const timers = [80, 300, 700].map((delay) => setTimeout(() => {
      listRef.current?.scrollToLocation({ ...target, viewPosition: 0, animated: false });
    }, delay));
    return () => timers.forEach(clearTimeout);
  }, [target]);

  return (
    <SectionList
      ref={listRef}
      sections={SOURCES.map((group) => ({ title: group.title, data: group.entries }))}
      style={styles.scroll}
      contentContainerStyle={styles.sourcesContent}
      showsVerticalScrollIndicator={false}
      renderSectionHeader={({ section }) => <Text style={styles.sourceGroupTitle}>{section.title}</Text>}
      renderItem={({ item }) => <SourceEntry citation={item} />}
      keyExtractor={(item) => `source-${item.id}`}
      ListHeaderComponent={
        <View
          style={styles.sourceIntro}
        >
          <Text style={styles.introText}>
            The scientific and historical material in About TrailWeigh is based on the sources below. Research findings describe results observed in studies and populations; they are not guarantees of individual outcomes and should not be interpreted as medical advice.
          </Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.aboutSources}>
          <Text style={styles.sourceGroupTitle}>About These Sources</Text>
          <Text style={styles.sourceNote}>Scientific research evolves. TrailWeigh summarizes research for general educational purposes and will favor systematic reviews, meta-analyses, peer-reviewed research, and authoritative public-health sources whenever practical.</Text>
          <Text style={styles.sourceNote}>Research findings describe averages and associations observed in particular studies and populations. They do not guarantee that any individual will experience the same result and should not be interpreted as medical advice.</Text>
          <Text style={styles.sourceNote}>Religious and philosophical quotations are included as examples of different ways human beings have expressed ideas about nature, meaning, stewardship, and connection. They are not presented as scientific evidence.</Text>
          <Text style={styles.sourceNote}>TrailWeigh is an independent project. References to third parties are provided for historical, educational, and citation purposes only and do not imply sponsorship, affiliation, or endorsement.</Text>
        </View>
      }
      onScrollToIndexFailed={() => {
        if (target) setTimeout(() => listRef.current?.scrollToLocation({ ...target, viewPosition: 0, animated: false }), 250);
      }}
    />
  );
}

export function InfoScreen({
  visible,
  page,
  onBack,
  onOpenHelp,
  onOpenSources,
  sourceRef,
}: {
  visible: boolean;
  page: InfoPage | null;
  onBack: () => void;
  onOpenHelp: () => void;
  onOpenSources: (ref?: number) => void;
  sourceRef?: number | null;
}) {
  const insets = useSafeAreaInsets();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) setOpenSections(new Set());
  }, [visible, page]);

  if (!visible || !page) return null;

  const toggle = (id: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const title =
    page === 'help' ? 'Help & Tutorials' :
    page === 'about' ? 'About TrailWeigh' :
    page === 'how-it-works' ? 'How It Works' :
    'Sources & References';

  const sections = page === 'help' ? HELP_SECTIONS :
    page === 'about' ? ABOUT_SECTIONS as SectionWithCitations[] :
    HOW_IT_WORKS_SECTIONS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onBack}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="info-back"
          >
            <Ionicons name="chevron-back" size={22} color={NAV_ACTIVE} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>
        {page === 'sources' ? (
          <SourcesBody scrollToRef={sourceRef} />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            {page === 'help' && (
              <>
                <Text style={styles.pageHeading}>Help & How-To</Text>
                <Text style={styles.introText}>Select any topic to expand it. All sections start collapsed. You can have more than one open at a time.</Text>
              </>
            )}
            {page === 'how-it-works' && (
              <>
                <Text style={styles.pageHeading}>How It Works</Text>
                <Text style={styles.introText}>TrailWeigh follows a simple workflow: build your gear list or checklist, organize and refine it, then save, print, or share it. Open a topic below to see how each part works.</Text>
              </>
            )}
            {page === 'about' && (
              <>
                <Text style={styles.pageHeading}>About TrailWeigh</Text>
                {ABOUT_INTRO.map((paragraph) => <Text key={paragraph} style={styles.bodyText}>{paragraph}</Text>)}
              </>
            )}
            {sections.map((section) => (
              <AccordionSection
                key={section.id}
                section={section as SectionWithCitations}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggle(section.id)}
                onCitation={page === 'about' ? onOpenSources : undefined}
              />
            ))}
            {page === 'how-it-works' && (
              <View style={styles.footerCard}>
                <Text style={styles.bodyText}>Need detailed step-by-step instructions? Visit </Text>
                <TouchableOpacity onPress={onOpenHelp} accessibilityRole="link">
                  <Text style={styles.inlineLink}>Help & How-To</Text>
                </TouchableOpacity>
                <Text style={styles.bodyText}>.</Text>
              </View>
            )}
            {page === 'help' && (
              <View style={styles.footerCard}>
                <Text style={styles.bodyText}>Still stuck? If something isn't working the way you expect, visit Report a Problem for guidance on what to include when you get in touch.</Text>
              </View>
            )}
            {page === 'about' && (
              <View style={styles.footerCard}>
                <TouchableOpacity onPress={() => onOpenSources()} accessibilityRole="link">
                  <Text style={styles.inlineLink}>Sources & References</Text>
                </TouchableOpacity>
                <Text style={styles.bodyText}>  For step-by-step instructions, visit </Text>
                <TouchableOpacity onPress={onOpenHelp} accessibilityRole="link">
                  <Text style={styles.inlineLink}>Help & How-To</Text>
                </TouchableOpacity>
                <Text style={styles.bodyText}>.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  header: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, backgroundColor: CARD_BG,
    borderBottomWidth: 1, borderBottomColor: DIVIDER,
  },
  backButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 74 },
  backText: { color: NAV_ACTIVE, fontSize: 15, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', color: PRIMARY, fontSize: 16, fontWeight: '700' },
  headerSpacer: { width: 74 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12 },
  sourcesContent: { padding: 20, paddingBottom: 44, gap: 24 },
  pageHeading: { color: PRIMARY, fontSize: 28, fontWeight: '900', marginBottom: 2 },
  introText: { color: SECONDARY, fontSize: 14, lineHeight: 22 },
  bodyText: { color: SECONDARY, fontSize: 14, lineHeight: 22, marginBottom: 10 },
  sectionCard: { backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: DIVIDER, overflow: 'hidden' },
  sectionHeader: { minHeight: 58, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { flex: 1, color: PRIMARY, fontSize: 15, fontWeight: '700' },
  sectionBody: { padding: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: DIVIDER },
  citationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  citationButton: { color: NAV_ACTIVE, fontSize: 13, textDecorationLine: 'underline', fontWeight: '600' },
  footerCard: { backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: DIVIDER, padding: 16, flexDirection: 'row', flexWrap: 'wrap' },
  inlineLink: { color: NAV_ACTIVE, textDecorationLine: 'underline', fontWeight: '600', fontSize: 14, lineHeight: 22 },
  sourceGroup: { gap: 12 },
  sourceIntro: { marginBottom: 20 },
  sourceGroupTitle: { color: PRIMARY, fontSize: 15, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: DIVIDER, paddingBottom: 8 },
  sourceEntry: { paddingVertical: 2 },
  sourceText: { color: SECONDARY, fontSize: 13, lineHeight: 20 },
  sourceNumber: { color: PRIMARY, fontWeight: '700' },
  sourceNote: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sourceLink: { color: NAV_ACTIVE, fontSize: 12, textDecorationLine: 'underline', marginTop: 4 },
  aboutSources: { borderTopWidth: 1, borderTopColor: DIVIDER, paddingTop: 16, gap: 8 },
});