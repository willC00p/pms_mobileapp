import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Settings() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Option: Change Password */}
      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionText}>Change Password</Text>
        <ChevronRight size={20} color="#000" />
      </TouchableOpacity>

      {/* Option: Privacy Policy */}
      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionText}>Privacy Policy</Text>
        <ChevronRight size={20} color="#000" />
      </TouchableOpacity>

      {/* Option: Delete Account */}
      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionText}>Delete Account</Text>
        <ChevronRight size={20} color="#000" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#C34C4D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
});