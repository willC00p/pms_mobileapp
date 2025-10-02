import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { setSignup, getSignup } from '../_lib/signupStore';

export default function DetailsVehicle() {
  const router = useRouter();
  const s = getSignup();

  const demoCourses = ['BSIT', 'BSCS', 'BSEd', 'BSBA', 'BSTM'];
  const demoDepartments = ['College of Computer Studies', 'College of Education', 'College of Business', 'College of Arts'];

  function validateAndNext() {
    const cur = getSignup();
    const errs: string[] = [];
    if (!cur.firstname || !cur.firstname.trim()) errs.push('First name is required');
    if (!cur.lastname || !cur.lastname.trim()) errs.push('Last name is required');
    // contact number: accept +63XXXXXXXXXX or 09XXXXXXXXX
    const phone = (cur.contact_number || '').replace(/\s+/g, '');
    if (!phone || !(phone.match(/^\+63[0-9]{9,10}$/) || phone.match(/^09[0-9]{9}$/))) {
      errs.push('Contact number must be in Philippines format (e.g. +639123456789 or 09123456789)');
    }
    // plate validation: require at least 2 chars and alnum/hyphen
    const plate = (cur.plate_number || '').trim();
    if (!plate || !/^[A-Z0-9\- ]{2,15}$/i.test(plate)) errs.push('Plate number is invalid or missing');
    if (cur.role === 'student') {
      if (!cur.student_no || !cur.student_no.trim()) errs.push('Student number is required');
      if (!cur.course || !cur.course.trim()) errs.push('Course is required');
      if (!cur.department || !cur.department.trim()) errs.push('Department is required');
    }
    if (errs.length) return Alert.alert('Validation', errs.join('\n'));
    // normalize contact if starts with 09 -> convert to +63
    if (phone.startsWith('09')) {
      const converted = '+63' + phone.slice(1);
      setSignup({ contact_number: converted });
    }
    router.push({ pathname: '/login/Confirm' } as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold mt-8">Your information</Text>
          <View className="mt-2">
            <Text className="text-sm text-gray-600">Step 2 of 5</Text>
          </View>
          <View className="mt-6">
        <Text>First name</Text>
        <TextInput defaultValue={s.firstname} onChangeText={(t) => setSignup({ firstname: t })} className="border p-2 rounded mt-1" />
  <Text className="mt-3">Middle name (optional)</Text>
  <TextInput defaultValue={s.middlename} onChangeText={(t) => setSignup({ middlename: t })} className="border p-2 rounded mt-1" />
        <Text className="mt-3">Last name</Text>
        <TextInput defaultValue={s.lastname} onChangeText={(t) => setSignup({ lastname: t })} className="border p-2 rounded mt-1" />

        {/* role-specific fields */}
        {s.role === 'student' && (
          <>
            <Text className="mt-3">Student No.</Text>
            <TextInput defaultValue={s.student_no} onChangeText={(t) => setSignup({ student_no: t })} className="border p-2 rounded mt-1" />
                <Text className="mt-3">Course</Text>
                <View className="border rounded mt-1">
                  <Picker selectedValue={s.course || ''} onValueChange={(v) => setSignup({ course: String(v) })}>
                    <Picker.Item label="Select course" value="" />
                    {demoCourses.map(c => <Picker.Item key={c} label={c} value={c} />)}
                  </Picker>
                </View>
            <Text className="mt-3">Year/Section</Text>
            <TextInput defaultValue={s.yr_section} onChangeText={(t) => setSignup({ yr_section: t })} className="border p-2 rounded mt-1" />
          </>
        )}
        {s.role === 'staff' && (
          <>
            <Text className="mt-3">Faculty ID</Text>
            <TextInput defaultValue={s.faculty_id} onChangeText={(t) => setSignup({ faculty_id: t })} className="border p-2 rounded mt-1" />
            <Text className="mt-3">Employee ID</Text>
            <TextInput defaultValue={s.employee_id} onChangeText={(t) => setSignup({ employee_id: t })} className="border p-2 rounded mt-1" />
            <Text className="mt-3">Position</Text>
            <TextInput defaultValue={s.position} onChangeText={(t) => setSignup({ position: t })} className="border p-2 rounded mt-1" />
          </>
        )}

        <Text className="mt-3">Contact number</Text>
        <TextInput defaultValue={s.contact_number || '+63'} onChangeText={(t) => setSignup({ contact_number: t })} keyboardType="phone-pad" placeholder="+63 912 345 6789" className="border p-2 rounded mt-1" />

        <Text className="mt-3">Department</Text>
        <View className="border rounded mt-1">
          <Picker selectedValue={s.department || ''} onValueChange={(v) => setSignup({ department: String(v) })}>
            <Picker.Item label="Select department" value="" />
            {demoDepartments.map(d => <Picker.Item key={d} label={d} value={d} />)}
          </Picker>
        </View>

  <Text className="mt-3">Plate number</Text>
  <TextInput defaultValue={s.plate_number} onChangeText={(t) => setSignup({ plate_number: t.toUpperCase() })} className="border p-2 rounded mt-1" autoCapitalize="characters" />

  <Text className="mt-3">Vehicle type</Text>
  <View className="border rounded mt-1">
    <Picker selectedValue={s.vehicle_type || 'car'} onValueChange={(v) => setSignup({ vehicle_type: String(v) })}>
      <Picker.Item label="Car" value="car" />
      <Picker.Item label="Motorcycle" value="motorcycle" />
    </Picker>
  </View>

  <Text className="mt-3">Vehicle color</Text>
  <TextInput defaultValue={s.vehicle_color} onChangeText={(t) => setSignup({ vehicle_color: t })} className="border p-2 rounded mt-1" />

  <Text className="mt-3">Brand</Text>
  <TextInput defaultValue={s.brand} onChangeText={(t) => setSignup({ brand: t })} className="border p-2 rounded mt-1" />

  <Text className="mt-3">Model</Text>
  <TextInput defaultValue={s.model} onChangeText={(t) => setSignup({ model: t })} className="border p-2 rounded mt-1" />

          </View>

          <View className="mt-6 flex-row justify-between">
          <TouchableOpacity className="px-4 py-2" onPress={() => router.back()}>
            <Text>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-bsu rounded-full py-3 items-center px-6" onPress={validateAndNext}>
            <Text className="text-white">Next</Text>
          </TouchableOpacity>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
