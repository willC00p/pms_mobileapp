import { useRouter } from 'expo-router';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { getSignup } from '../_lib/signupStore';

export default function Confirm() {
  const router = useRouter();
  const s = getSignup();
  const roleMap: Record<string,string> = { '3': 'Student', '4': 'Faculty', '5': 'Employee', '7': 'Security Guard' };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Text className="text-2xl font-bold mt-8">Confirm your details</Text>
      <View className="mt-6">
  <Text>Username: {s.username}</Text>
  {s.role ? <Text>Role: {roleMap[String(s.role)] || s.role}</Text> : null}
        <Text>Email: {s.email}</Text>
  <Text>Name: {s.firstname} {s.middlename ? s.middlename + ' ' : ''}{s.lastname}</Text>
        <Text>Contact: {s.contact_number}</Text>
        <Text>Plate: {s.plate_number}</Text>
        <Text>Vehicle: {s.vehicle_type}</Text>
          {String(s.role) === '3' && (
            <>
              <Text>Student No: {s.student_no}</Text>
              <Text>Course: {s.course}</Text>
              <Text>Year/Section: {s.yr_section}</Text>
            </>
          )}
          {String(s.role) === '4' && (
            <>
              <Text>Faculty ID: {s.faculty_id}</Text>
              <Text>Position: {s.position}</Text>
            </>
          )}
          {String(s.role) === '5' && (
            <>
              <Text>Employee ID: {s.employee_id}</Text>
              <Text>Position: {s.position}</Text>
            </>
          )}
      </View>

      <View className="mt-6 flex-row justify-between">
        <TouchableOpacity onPress={() => router.back()} className="px-4 py-2"><Text>Back</Text></TouchableOpacity>
        <TouchableOpacity className="bg-bsu rounded-full py-3 items-center px-6" onPress={() => router.push({ pathname: '/login/UploadIdFace' } as any)}>
          <Text className="text-white">Looks good</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
