import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { setSignup, getSignup } from '../_lib/signupStore';

export default function BasicCredentials() {
  const router = useRouter();
  const s = getSignup();

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Text className="text-2xl font-bold mt-8">Create account</Text>
      {s.role ? <Text className="text-sm text-gray-600 mt-1">Role: {s.role}</Text> : null}
      <View className="mt-2">
        <Text className="text-sm text-gray-600">Step 1 of 5</Text>
      </View>

      <View className="mt-6">
        <Text>Username</Text>
        <TextInput defaultValue={s.username} onChangeText={(t) => setSignup({ username: t })} className="border p-2 rounded mt-1" />
        <Text className="mt-3">Email</Text>
        <TextInput defaultValue={s.email} onChangeText={(t) => setSignup({ email: t })} keyboardType="email-address" className="border p-2 rounded mt-1" autoCapitalize="none" />
        <Text className="mt-3">Password</Text>
        <TextInput defaultValue={s.password} onChangeText={(t) => setSignup({ password: t })} secureTextEntry className="border p-2 rounded mt-1" />
      </View>

      <View className="mt-6">
        <TouchableOpacity className="bg-bsu rounded-full py-3 items-center" onPress={() => router.push({ pathname: '/login/DetailsVehicle' } as any)}>
          <Text className="text-white">Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
