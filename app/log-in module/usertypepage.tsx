import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function UserTypePage() {
  const router = useRouter();
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const profiles = ["Student", "Faculty", "Personnel", "Security Guard"];

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", paddingHorizontal: 24 }}>
      <Image
        source={require("../../assets/images/bulsu-logo.png")}
        style={{ width: 96, height: 96, marginTop: -40 }}
        resizeMode="contain"
      />
      <Text style={{ color: "#000", fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
        BULACAN STATE UNIVERSITY
      </Text>
      <Text style={{ color: "#000", fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>
        PARKING MANAGEMENT SYSTEM
      </Text>
      <Text style={{ color: "#000", fontSize: 14, fontStyle: "italic", marginBottom: 24, textAlign: "center" }}>
        Drive In. Park Smart. Move On On.
      </Text>

      {/* Picker substitute for Select */}
      <View style={{ width: "100%", marginBottom: 16, borderWidth: 1, borderColor: "#ccc", borderRadius: 6 }}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => setSelectedValue(itemValue)}
        >
          <Picker.Item label="Select Your Profile" value={null} />
          {profiles.map((profile) => (
            <Picker.Item key={profile} label={profile} value={profile} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: "#C34C4D",
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          width: "100%",
        }}
            onPress={() => {
          if (selectedValue) {
            router.push({
              pathname: '/login/login', // Use the correct route as defined in your router
              params: { role: selectedValue.toLowerCase() },
            } as any);
          }
        }}
      >
        <Text style={{ color: "#ffffff", textAlign: "center", fontWeight: "600" }}>
          Proceed
        </Text>
      </TouchableOpacity>
    </View>
  );
}