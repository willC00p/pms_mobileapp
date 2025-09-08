import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  return <Stack> 
    <Stack.Screen
      name="navigation-bar"
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="available-parking/[id]"
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="components/[Hamburger-menu]"
      options={{ headerShown: false }}
    />
  </Stack>;
}