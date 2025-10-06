import { Link, useRouter } from "expo-router";
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../_lib/api';
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
      router.replace('/main-home/home');
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
      <View className="items-center mt-10">
        <Image
          source={require("../../assets/images/bulsu-logo.png")}
          className="w-32 h-32"
          resizeMode="contain"
        />
        <Text className="mt-4 text-2xl font-bold text-black text-center">
          Bulacan State University
        </Text>
        <Text className="text-lg text-gray-600 text-center">
          Parking Management System
        </Text>
        <Text className="mt-2 text-sm italic text-gray-500 text-center">
          Drive In. Park Smart. Move On.
        </Text>
      </View>

      {/* Form */}
      <View className="mt-10 space-y-6">
        {/* Email */}
        <View>
          <Text className="text-sm text-gray-700 mb-1">Email</Text>
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            className="border-b border-gray-300 pb-2 text-base text-black"
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
        <View>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <TouchableOpacity className="bg-bsu rounded-full py-3 items-center" onPress={handleLogin}>
              <Text className="text-white text-base font-semibold">Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sign Up Link */}
      <View className="flex-row justify-center mt-6">
  <Text className="text-sm text-gray-600 mr-1">Don&apos;t have an account?</Text>
        <Link href="/login/choose-role" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text className="text-sm text-blue-600 font-semibold">Register</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}
