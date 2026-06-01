import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#001430',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
          // Clears the iPhone home indicator; minimum 16 pt on older devices.
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarActiveTintColor: '#4a9eff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.38)',
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <SymbolView name="square.grid.2x2.fill" tintColor={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <SymbolView name="map.fill" tintColor={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'AI Insights',
          tabBarIcon: ({ color }) => (
            <SymbolView name="sparkles" tintColor={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ color }) => (
            <SymbolView name="chart.xyaxis.line" tintColor={color} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Devices',
          tabBarIcon: ({ color }) => (
            <SymbolView name="cpu" tintColor={color} size={20} />
          ),
        }}
      />
    </Tabs>
  );
}
