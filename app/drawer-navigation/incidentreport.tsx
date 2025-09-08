import CheckBox from '@react-native-community/checkbox';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';

export default function ReportIncident() {
  const [incidentType, setIncidentType] = useState('Close Call');
  const [reporter, setReporter] = useState('');
  const [involvedPerson, setInvolvedPerson] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <ChevronLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
      </View>

      {/* Type of Incident */}
      <Text style={styles.label}>Type of incident</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={incidentType}
          onValueChange={(value) => setIncidentType(value)}
          style={styles.picker}
        >
          <Picker.Item label="Close Call" value="Close Call" />
          <Picker.Item label="Near Miss" value="Near Miss" />
          <Picker.Item label="Accident" value="Accident" />
          <Picker.Item label="Hazard" value="Hazard" />
        </Picker>
      </View>

      {/* Person Reporting */}
      <Text style={styles.label}>Person reporting Incident</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter name"
        value={reporter}
        onChangeText={setReporter}
      />

      {/* Person Involved */}
      <Text style={styles.label}>Person involved in Incident</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter name"
        value={involvedPerson}
        onChangeText={setInvolvedPerson}
      />

      {/* Date and Time */}
      <Text style={styles.label}>Incident Date and Time</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{incidentDate.toLocaleString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={incidentDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setIncidentDate(selectedDate);
          }}
        />
      )}

      {/* Description */}
      <Text style={styles.label}>Describe the incident</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={5}
        placeholder="Enter details here..."
        value={description}
        onChangeText={setDescription}
      />

      {/* Privacy Policy */}
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
    height: 120,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
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