import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Profile = () => {
  return (
    <View className="flex-1 bg-[#F5F4F4]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="items-center px-6 pt-0">
          {/* Profile Title */}
          <Text className="text-black text-3xl font-bold mb-2" style={{ top: -10 }}>
            Profile
          </Text>

          {/* Profile Card */}
          <View className="h-auto w-full bg-F5F4F4 rounded-lg p-4 space-y-12" style={{ height: '100%' }}>
            {/* Profile Image and Info */}
            <View className="items-center space-y-3">
              <Image
                source={require('../../assets/images/bulsu-logo.png')}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: '#fff',
                }}
              />
              <Text className="text-black text-3xl font-bold text-center">Juancho Dela Cruz</Text>
              <Text className="text-black text-xl text-center -mt-1">Student</Text>
            </View>

            {/* Input Fields */}
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

            {/* Action Buttons */}
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
      </ScrollView>
    </View>
  );
};

export default Profile;