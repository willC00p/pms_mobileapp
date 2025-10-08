import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TextInput, View } from 'react-native';
import { setSignup, getSignup } from '../_lib/signupStore';
import { PrimaryButton, Card, Header } from '../components/ui';

export default function BasicCredentials() {
  const router = useRouter();
  const s = getSignup();
  const roleMap: Record<string,string> = { '3': 'Student', '4': 'Faculty', '5': 'Employee', '7': 'Security Guard' };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
  <Header title="Create account" subtitle={s.role ? `Role: ${roleMap[String(s.role)] || s.role}` : undefined} />
      <View className="mt-2">
        <Text className="text-sm text-gray-600">Step 1 of 5</Text>
      </View>

      <View style={{ padding: 16 }}>
        <Card>
          <Text>Username</Text>
          <TextInput defaultValue={s.username} onChangeText={(t) => setSignup({ username: t })} style={{ borderWidth: 1, borderColor: '#E5E7EB', padding: 8, borderRadius: 8, marginTop: 8 }} />
          <Text style={{ marginTop: 12 }}>Email</Text>
          <TextInput defaultValue={s.email} onChangeText={(t) => setSignup({ email: t })} keyboardType="email-address" style={{ borderWidth: 1, borderColor: '#E5E7EB', padding: 8, borderRadius: 8, marginTop: 8 }} autoCapitalize="none" />
          <Text style={{ marginTop: 12 }}>Password</Text>
          <TextInput defaultValue={s.password} onChangeText={(t) => setSignup({ password: t })} secureTextEntry style={{ borderWidth: 1, borderColor: '#E5E7EB', padding: 8, borderRadius: 8, marginTop: 8 }} />
        </Card>

        <PrimaryButton title="Next" onPress={() => router.push({ pathname: '/login/DetailsVehicle' } as any)} />
      </View>
    </SafeAreaView>
  );
}
