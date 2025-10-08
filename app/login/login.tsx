import { Link, useRouter } from "expo-router";
import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { PrimaryButton, Card, Header } from '../components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, isRole } from '../_lib/api';
import 'react-native-gesture-handler';

export default function Index() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing credentials', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const body = { email: email.trim(), password };
      const res = await apiFetch('/api/login', { method: 'POST', body: JSON.stringify(body) });
      // backend returns { data: { token, name }, message }
      const token = res?.data?.token;
      if (!token) throw new Error('No token returned from server');
      await AsyncStorage.setItem('auth_token', token);
      // optional: store user name
      if (res?.data?.name) await AsyncStorage.setItem('auth_name', res.data.name);
      // Fetch profile to determine role and redirect appropriately
      try {
        const profile = await apiFetch('/api/settings/profile');
        if (isRole(profile, 'Guard') || isRole(profile, 7)) {
          router.replace('/guard/home');
        } else {
          router.replace('/main-home/home');
        }
      } catch (e) {
        // If profile fetch fails, fallback to main home
        router.replace('/main-home/home');
      }
    } catch (err: any) {
      console.error('Login failed', err);
      const msg = (err && err.body && err.body.message) ? err.body.message : (err?.message || 'Login failed');
      Alert.alert('Login failed', String(msg));
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Logo + Titles */}
      <Header title="Bulacan State University" subtitle="Parking Management System" />
      <View style={{ padding: 18, alignItems: 'center' }}>
        <Image
          source={require("../../assets/images/bulsu-logo.png")}
          className="w-32 h-32"
          resizeMode="contain"
        />
        <Text style={{ marginTop: 12, fontSize: 18, fontWeight: '700' }}>Parking Management System</Text>
        <Text style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>Drive In. Park Smart. Move On.</Text>
      </View>

      {/* Form */}
      <View style={{ paddingHorizontal: 18, marginTop: 6 }}>
        {/* Email */}
        <View>
          <Text className="text-sm text-gray-700 mb-1">Email</Text>
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ borderBottomWidth: 1, borderColor: '#E5E7EB', paddingBottom: 8, color: '#111827' }}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View>
          <Text className="text-sm text-gray-700 mb-1">Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            autoCapitalize="none"
            className="border-b border-gray-300 pb-2 text-base text-black"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity className="self-end mt-1">
            <Text className="text-sm text-blue-600">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In */}
        <View style={{ marginTop: 18 }}>
          {loading ? <ActivityIndicator /> : <PrimaryButton title="Sign In" onPress={handleLogin} />}
        </View>
      </View>

      {/* Sign Up Link */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18 }}>
        <Text style={{ color: '#6B7280', marginRight: 8 }}>Don't have an account?</Text>
        <Link href="/login/choose-role" asChild>
          <PrimaryButton title="Register" onPress={() => {}} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#C34C4D' }} />
        </Link>
      </View>
    </SafeAreaView>
  );
}
