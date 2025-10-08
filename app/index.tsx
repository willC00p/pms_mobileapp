import { Link } from "expo-router";

import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center">
  <Text className="text-5xl text-blue-500 font-bold">Welcome!</Text>

        <Link href="/login/login" asChild>
    <TouchableOpacity className="bg-bsu rounded-full py-3 px-6 mt-6">
      <Text className="text-white text-base font-semibold">Get Started</Text>
    </TouchableOpacity>
  </Link>
</View>
  );
}
