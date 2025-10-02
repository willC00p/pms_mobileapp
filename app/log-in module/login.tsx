import { Link, useRouter } from "expo-router";
import {
    Image,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import 'react-native-gesture-handler';

export default function Index() {
  const router = useRouter();
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
          />
          <TouchableOpacity className="self-end mt-1">
            <Text className="text-sm text-blue-600">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In */}
        <View>
          
          <Link href="/main-home/home" asChild>
            <TouchableOpacity className="bg-bsu rounded-full py-3 items-center">
              <Text className="text-white text-base font-semibold">Sign In</Text>
            </TouchableOpacity>
            </Link>
         
        </View>
      </View>

      {/* TEST BUTTON FOR TESTING PAGES 
export { default } from '../login/login';
        <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded mt-4">
          <Text className="text-white font-bold text-center">TEST BUTTON</Text>
        </TouchableOpacity>
      </Link> */}

      {/* Sign Up Link */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-sm text-gray-600 mr-1">Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/login/choose-role' } as any)}>
          <Text className="text-sm text-blue-600 font-semibold">Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}