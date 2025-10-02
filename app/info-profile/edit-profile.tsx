import {
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const EditProfile = () => {
  return (
    <View className="flex-1 bg-[#F5F4F4]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 pt-10">
          {/* Back Button */}
          <TouchableOpacity className="mb-4">
            <Text className="text-[#C34C4D] text-lg font-bold">Back</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-black text-3xl font-bold mb-6">
            Edit Information
          </Text>

          {/* Profile Image */}
          <View className="items-center mb-6">
            <Image
              source={require('../../assets/images/bulsu-logo.png')}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#fff',
              }}
            />
          </View>

          {/* Input Fields */}
          <View>
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Student Number"
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Contact No."
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Select Department"
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Select Vehicle Type"
              placeholderTextColor="#999"
              style={inputStyle}
            />
            <TextInput
              placeholder="Plate No."
              placeholderTextColor="#999"
              style={inputStyle}
            />
          </View>

          {/* Action Buttons */}
          <View className="mt-8">
            <TouchableOpacity className="bg-[#C34C4D] rounded-lg py-3 items-center mb-4">
              <Text className="text-white font-bold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#F5F4F4] rounded-lg py-3 items-center border border-[#C34C4D]">
              <Text className="text-[#C34C4D] font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const inputStyle = {
  backgroundColor: 'white',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#C9C9C9',
  paddingHorizontal: 16,
  paddingVertical: 16,
  color: 'black',
  marginBottom: 10,
};

export default EditProfile;