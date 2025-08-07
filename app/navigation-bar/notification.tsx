import { Text, View } from 'react-native'


const notification = () => {
  return (
    <View className="flex-1 justify-center items-center bg-F5F4F4 relative">
      <View className="bg-[#D32F2F] w-full h-40 absolute top-10 left-0" />
      <Text className="text-white text-3xl font-bold absolute top-20 mt-15 pt-5">
        Notifications
      </Text>
    </View>
  )
}

export default notification