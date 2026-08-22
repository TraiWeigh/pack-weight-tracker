/**
 * _layout.tsx — N004 / R0112
 *
 * Hides the native Gear/Summary tab capsule entirely.
 * Both routes (index, summary) remain registered and navigable via useRouter.
 * The TrailWeigh BottomBox (in index.tsx) owns all visible bottom navigation.
 */
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Completely hide the tab bar — TrailWeigh BottomBox handles navigation
        tabBarStyle: { display: 'none', height: 0 },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="summary" />
    </Tabs>
  );
}
