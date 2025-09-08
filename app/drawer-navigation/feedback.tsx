import CheckBox from '@react-native-community/checkbox';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FeedbackForm() {
  const [rating, setRating] = useState(3);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
      </View>

      {/* Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} placeholder="Enter your full name" />

      {/* Department */}
      <Text style={styles.label}>Department</Text>
      <TextInput style={styles.input} placeholder="Enter your department" />

      {/* Service Rating */}
      <Text style={styles.label}>Your service rating</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setRating(i)}>
            <Text style={[styles.star, i <= rating && styles.starFilled]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Additional Feedback */}
      <Text style={styles.label}>Additional Feedback</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        placeholder="If you have any additional feedback, please type it in here..."
      />

      {/* Privacy Policy Checkbox */}
      <View style={styles.checkboxContainer}>
        <CheckBox value={acceptedPolicy} onValueChange={setAcceptedPolicy} />
        <Text style={styles.checkboxLabel}>I have read and accept the Privacy Policy.</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  starRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  star: {
    fontSize: 28,
    color: '#ccc',
    marginRight: 6,
  },
  starFilled: {
    color: '#FFD700',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#C34C4D',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});