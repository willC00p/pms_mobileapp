import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function StudentInfoScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [department, setDepartment] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNo, setPlateNo] = useState("");

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={require("../../assets/images/bulsu-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Header Texts */}
      <Text style={styles.title}>Student Information</Text>
      <Text style={styles.subtitle}>Provide the Details Below</Text>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Student No."
        value={studentNo}
        onChangeText={setStudentNo}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact No."
        value={contactNo}
        onChangeText={setContactNo}
        keyboardType="phone-pad"
      />

      {/* Department Picker */}
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={department}
          onValueChange={(itemValue) => setDepartment(itemValue)}
        >
          <Picker.Item label="Select Department" value="" />
          <Picker.Item label="CICT" value="CICT" />
          <Picker.Item label="CN" value="CN" />
          <Picker.Item label="CLaw" value="CLaw" />
          {/* Add more departments if needed */}
        </Picker>
      </View>

      {/* Vehicle Type Picker */}
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={vehicleType}
          onValueChange={(itemValue) => setVehicleType(itemValue)}
        >
          <Picker.Item label="Select Vehicle Type" value="" />
          <Picker.Item label="Car" value="Car" />
          <Picker.Item label="Motorcycle" value="Motorcycle" />
          <Picker.Item label="SUV" value="SUV" />
          <Picker.Item label="Jeep" value="Jeep" />
          {/* Add more types if needed */}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Plate No."
        value={plateNo}
        onChangeText={setPlateNo}
        autoCapitalize="characters"
      />

      {/* Proceed Button */}
      <TouchableOpacity
        style={styles.proceedBtn}
        onPress={() => {
          // Add validation or navigation logic here
            router.push("/login/uploadidstudent");
        }}
      >
        <Text style={styles.proceedText}>Proceed</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: "#C34C4D",
    fontWeight: "500",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  proceedBtn: {
    backgroundColor: "#C34C4D",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  proceedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});