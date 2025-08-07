import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const Profile = () => {
  return (
    <View className="flex-1 bg-[#F5F4F4]">
      <View className="items-center px-6 pt-28">
      <Text className="text-black text-3xl font-bold mb-8" style={{ top: -28 }}>Profile</Text>

      <View className="h-auto w-full bg-F5F4F4 rounded-lg p-4 space-y-12" style={{ height: '100%' }}>
        <View className="space-y-10">
        <Text className="text-center text-black text-3xl">Juancho Dela Cruz</Text>
        <Text className="text-center text-black text-xl -mt-1">Student</Text>
        </View>

        <View style={{ marginTop: 32 }}>
        <TextInput
          style={{
          backgroundColor: 'white',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#C9C9C9',
          paddingHorizontal: 16,
          paddingVertical: 16,
          color: 'black',
          marginBottom: 10,
          }}
          value="2022189465"
          editable={false}
        />
        <TextInput
          style={{
          backgroundColor: 'white',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#C9C9C9',
          paddingHorizontal: 16,
          paddingVertical: 16,
          color: 'black',
          marginBottom: 10,
          }}
          value="0911 143 9821"
          editable={false}
        />
        <TextInput
          style={{
          backgroundColor: 'white',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#C9C9C9',
          paddingHorizontal: 16,
          paddingVertical: 16,
          color: 'black',
          marginBottom: 10,
          }}
          value="College of Nursing"
          editable={false}
        />
        <TextInput
          style={{
          backgroundColor: 'white',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#C9C9C9',
          paddingHorizontal: 16,
          paddingVertical: 16,
          color: 'black',
          marginBottom: 10,
          }}
          value="SUV"
          editable={false}
        />
        </View>

        <View className="mt-4">
        <TouchableOpacity className="bg-[#FFC800] rounded-lg py-3 items-center mb-4">
          <Text className="text-white font-bold">View Vehicle</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#C34C4D] rounded-lg py-3 items-center mb-4">
          <Text className="text-white font-bold">Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#F5F4F4] rounded-lg py-3 items-center border border-[#C34C4D]">
          <Text className="text-[#C34C4D] font-bold">Logout</Text>
        </TouchableOpacity>
        </View>
      </View>
      </View>
    </View>
  );
};

export default Profile;