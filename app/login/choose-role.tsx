import { Link, useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { setSignup } from '../_lib/signupStore';

export default function ChooseRole() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="mt-12 items-center">
        <Text className="text-2xl font-bold">Register an account</Text>
        <Text className="text-sm text-gray-600 mt-2">Choose your role to continue</Text>
      </View>

      <View className="mt-8 space-y-4">
        <TouchableOpacity
          className="bg-bsu rounded-full py-3 items-center"
          onPress={() => { setSignup({ role: 'student' }); router.push({ pathname: '/login/BasicCredentials' } as any); }}
        >
          <Text className="text-white text-base font-semibold">Student</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-800 rounded-full py-3 items-center"
          onPress={() => { setSignup({ role: 'staff' }); router.push({ pathname: '/login/BasicCredentials' } as any); }}
        >
          <Text className="text-white text-base font-semibold">Staff / Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-6" onPress={() => router.push({ pathname: '/login/login' } as any)}>
          <Text className="text-sm text-blue-600 text-center">Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
