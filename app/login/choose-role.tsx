import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, View, TouchableOpacity } from 'react-native';
import { setSignup } from '../_lib/signupStore';
import { PrimaryButton, Card, Header } from '../components/ui';

export default function ChooseRole() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="mt-12 items-center">
        <Text className="text-2xl font-bold">Register an account</Text>
        <Text className="text-sm text-gray-600 mt-2">Choose your role to continue</Text>
      </View>

      <Header title="Register an account" subtitle="Choose your role to continue" />
      <View style={{ padding: 16 }}>
        <Card>
          <PrimaryButton title="Student" onPress={() => { setSignup({ role: '3' }); router.push({ pathname: '/login/BasicCredentials' } as any); }} />
        </Card>
        <Card>
          <PrimaryButton title="Faculty" onPress={() => { setSignup({ role: '4' }); router.push({ pathname: '/login/BasicCredentials' } as any); }} />
        </Card>
        <Card>
          <PrimaryButton title="Employee" onPress={() => { setSignup({ role: '5' }); router.push({ pathname: '/login/BasicCredentials' } as any); }} />
        </Card>
        <Card>
          <PrimaryButton title="Security Guard" onPress={() => { setSignup({ role: '7' }); router.push({ pathname: '/login/BasicCredentials' } as any); }} />
        </Card>

        <TouchableOpacity className="mt-6" onPress={() => router.push({ pathname: '/login/login' } as any)}>
          <Text className="text-sm text-blue-600 text-center">Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
