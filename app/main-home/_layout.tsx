import React from 'react';
import HamburgerMenu from '@/components/Hamburger-menu';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { apiFetch, isRole } from '../_lib/api';
import { View, ActivityIndicator } from 'react-native';

export default function Layout() {
  const [isGuard, setIsGuard] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      let attempts = 0;
      const tryFetch = async () => {
        attempts += 1;
        try {
          const res = await apiFetch('/api/settings/profile');
          if (!mounted) return;
          if (isRole(res, 'Guard') || isRole(res, 7)) setIsGuard(true);
          if (mounted) setReady(true);
        } catch (err) {
          // If a transient auth timing issue (e.g., token not yet written), retry a couple times
          if (attempts < 3) {
            setTimeout(tryFetch, 700);
          } else {
            if (mounted) setReady(true);
          }
        }
      };
      tryFetch();
    })();
    return () => { mounted = false; };
  }, []);
  // Don't render tabs until profile role detection completes to avoid flashing wrong tab sets.
  // Render a simple loading view instead of a Tabs placeholder so the Tabs group isn't created
  // with the wrong screens (that caused guard users to land on a non-tabbed guard/home).
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true, // Enable header
        headerLeft: () => <HamburgerMenu />, // Inject HamburgerMenu
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#C34C4D',
        tabBarInactiveTintColor: '#A2A2A2',
      }}
    >
      {isGuard ? (
        // Minimal tab set for guards: Home, Scanner, Notifications
        <>
          <Tabs.Screen
            name="guard/home"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="guard/scan"
            options={{
              title: 'Scanner',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="scan-outline" size={28} color={color} />
              ),
            }}
          />
          {/* Guards: only Home and Scanner tabs - no notifications tab here */}
        </>
      ) : (
        // Regular user tab set
        <>
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="contact"
            options={{
              title: 'Contact',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="call-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="qr"
            options={{
              title: '',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="qr-code-outline" size={30} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="notification"
            options={{
              title: 'Notification',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="notifications-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          />
        </>
      )}
    </Tabs>
  );
}