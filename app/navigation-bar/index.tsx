import { useNavigation } from '@react-navigation/native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-F5F4F4 relative items-center">

      <View className="bg-[#D32F2F] w-full h-40 absolute top-10 left-0" />
      <View
        className="absolute left-15 w-64 h-24 bg-white rounded-xl shadow-md"
        style={{ top: 134 }}
      />

      <Text className="text-white text-3xl font-bold absolute top-20 mt-15 pt-5">
        Available Parkings
      </Text>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: '100%',
          marginTop: -30,
          paddingBottom: 210,
        }}
      >
        <TouchableOpacity
          className="bg-white rounded-xl shadow-md p-4 mt-80 w-80 h-24"
          onPress={() => console.log('Pimentel Hall pressed')}
        >
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-black text-lg font-bold">Pimentel Hall</Text>
            <View className="flex-row items-center">
              <Text className="text-black text-lg">17/20</Text>
              <View className="bg-[#F49000] w-4 h-4 rounded-full ml-2" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl shadow-md p-4 mt-8 w-80 h-24"
          onPress={() => console.log('Federizo Hall pressed')}
        >
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-black text-lg font-bold">Federizo Hall</Text>
            <View className="flex-row items-center">
              <Text className="text-black text-lg">12/20</Text>
              <View className="bg-[#89E219] w-4 h-4 rounded-full ml-2" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl shadow-md p-4 mt-8 w-80 h-24"
          onPress={() => console.log('Alvarado Hall pressed')}
        >
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-black text-lg font-bold">Alvarado Hall</Text>
            <View className="flex-row items-center">
              <Text className="text-black text-lg">9/10</Text>
              <View className="bg-[#B3261E] w-4 h-4 rounded-full ml-2" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-xl shadow-md p-4 mt-8 mb-10 w-80 h-24"
          onPress={() => console.log('College of Law pressed')}
        >
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-black text-lg font-bold">College of Law</Text>
            <View className="flex-row items-center">
              <Text className="text-black text-lg">29/35</Text>
              <View className="bg-[#F49000] w-4 h-4 rounded-full ml-2" />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}