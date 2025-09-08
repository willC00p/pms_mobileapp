import { router } from "expo-router";
import { Bell, Info, Menu, Settings, TriangleAlert } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function HamburgerMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnimation = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: menuVisible ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [menuVisible]);

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity onPress={() => setMenuVisible(true)}>
        <Menu color="#000" size={30} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal transparent visible={menuVisible} animationType="none">
        {/* Overlay */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setMenuVisible(false)}
        />

        {/* Sliding Menu */}
        <Animated.View
          style={{
            transform: [{ translateX: slideAnimation }],
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: width * 0.75,
            height: "100%",
            backgroundColor: "#fff",
          }}
        >
          {/* Red Header */}
          <View style={{ backgroundColor: "#D32F2F", padding: 20 }}>
            <Image
              source={require("../assets/images/bulsu-logo.png")} // Replace with Juancho's photo
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                marginBottom: 10,
              }}
            />
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              Hi, Juancho!
            </Text>
            <Text style={{ color: "#fff", fontSize: 14 }}>Dean</Text>
            <Text style={{ color: "#fff", fontSize: 14 }}>
              College of Information and Communications Technology
            </Text>
          </View>

          {/* Categories */}
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 20 }}>
              Categories
            </Text>

            <TouchableOpacity
              onPress={() => router.replace("../feedback")}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
            >
              <Bell color="#000" size={20} />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>Feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("../about")}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
            >
              <Info color="#000" size={20} />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>About Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("../incidentreport")}
              style={{ flexDirection: "row", alignItems: "center", marginBottom:  20 }}
            >
              <TriangleAlert color="#000" size={20} />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>Incident Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("../settings")}
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
            >
              <Settings color="#000" size={20} />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Log-out */}
                    <TouchableOpacity
            onPress={() => {
              // Add logout logic here
              setMenuVisible(false);
            }} 
            style={{
              position: "absolute",
              bottom: 30,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#D32F2F", fontSize: 16, textAlign: "center" }}>Log-out</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}