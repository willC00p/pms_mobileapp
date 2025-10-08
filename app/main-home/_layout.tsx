import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HamburgerMenu from '@/components/Hamburger-menu';

export default function Layout() {
  const TabIcon = ({ name, color, size }: { name: string; color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerLeft: () => <HamburgerMenu />,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#C34C4D',
        tabBarInactiveTintColor: '#A2A2A2',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="files"
        options={{
          title: 'Files',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <TabIcon name="document-text-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="contact"
        options={{
          title: 'Contact',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <TabIcon name="call-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="qr"
        options={{
          title: '',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <TabIcon name="qr-code-outline" color={color} size={30} />
          ),
        }}
      />

      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <TabIcon name="notifications-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}