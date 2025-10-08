import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const Contact = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <View className="flex-1 bg-[#F5F4F4] relative">
      <View className="bg-[#D32F2F] w-full h-40 absolute top-10 left-0" />
      <Text className="text-white text-3xl font-bold absolute top-20 self-center pt-5">
        Contact the Driver
      </Text>

      <View className="absolute top-56 w-full flex-row justify-around px-4">
        <TouchableOpacity className="bg-white border border-[#D32F2F] w-32 py-1 rounded-md">
          <Text className="text-[#D32F2F] font-semibold text-left self-start pl-3">Search</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white border border-[#D32F2F] w-32 py-1 rounded-md">
          <Text className="text-[#D32F2F] font-semibold text-left self-start pl-3">Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white border border-[#D32F2F] w-32 py-1 rounded-md">
          <Text className="text-[#D32F2F] font-semibold text-left self-start pl-3">Calls</Text>
        </TouchableOpacity>
      </View>

      <View className="absolute top-72 w-full items-center px-6">
        <View className="bg-white border border-[#CFCFCF] rounded-md flex-row items-center px-4 py-2 w-full">
          <Ionicons name="search" size={20} color="#999" className="mr-2" />
          <TextInput
            placeholder="Search for car plate no."
            className="flex-1 text-black"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default Contact;