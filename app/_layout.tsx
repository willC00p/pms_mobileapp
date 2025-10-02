import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  return (
    <Stack initialRouteName="index"> {/* pang set ng starting point */}
      <Stack.Screen
        name="main-home"
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
        <Stack.Screen name="log-in module/index" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/login" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/signup" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/usertypepage" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/studentinfo" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/uploadidstudent" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/orcrstudent" options={{ headerShown: false }} />
        <Stack.Screen name="log-in module/qrconfirmstudent" options={{ headerShown: false }} />
    </Stack>
  );
}