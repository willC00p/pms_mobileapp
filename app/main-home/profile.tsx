import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import React from 'react';
import { apiFetch } from '../_lib/api';
import { useRouter } from 'expo-router';

const Profile = () => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Prefer authenticated settings/profile endpoint. Backend wraps payload in { data }
        const res = await apiFetch('/api/settings/profile');
        if (!mounted) return;
        // Unwrap common API wrapper: use `data` when present
        setUser(res?.data ?? res);
      } catch (err) {
        // If auth failed, try the generic /user endpoint
        try {
          const u = await apiFetch('/api/user');
          if (!mounted) return;
          setUser(u?.data ?? u);
        } catch (e) {
          // show a friendly error
          Alert.alert('Profile', 'Unable to load profile. Please sign in.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Normalize shape: some API responses return { user, userDetail } inside the data payload.
  const userObj = user?.user ? user.user : user;
  const name = userObj?.name || (userObj?.user_detail?.firstname ? `${userObj.user_detail.firstname} ${userObj.user_detail.lastname}` : (user?.user_detail?.firstname ? `${user.user_detail.firstname} ${user.user_detail.lastname}` : ''));
  const role = userObj?.role?.name || (user?.role?.name) || 'Student';
  const ud = userObj?.userDetail || userObj?.user_detail || user?.user_detail || {};

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#C34C4D" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F4F4]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="items-center px-6 pt-0">
          {/* Profile Title */}
          <Text className="text-black text-3xl font-bold mb-2" style={{ top: -10 }}>
            Profile
          </Text>

          {/* Profile Card */}
          <View className="h-auto w-full bg-F5F4F4 rounded-lg p-4 space-y-12" style={{ height: '100%' }}>
            {/* Profile Image and Info */}
            <View className="items-center space-y-3">
              {(ud?.profile_pic || userObj?.profile_pic || user?.profile_pic) ? (
                <Image source={{ uri: ud.profile_pic || userObj?.profile_pic || user?.profile_pic }} style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff' }} />
              ) : (
                <Image source={require('../../assets/images/bulsu-logo.png')} style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff' }} />
              )}
              <Text className="text-black text-3xl font-bold text-center">{name || '—'}</Text>
              <Text className="text-black text-xl text-center -mt-1">{role}</Text>
            </View>

            {/* Input Fields */}
            <View style={{ marginTop: 32 }}>
              <TextInput style={inputStyle} value={ud?.student_no || ud?.id_number || ''} editable={false} />
              <TextInput style={inputStyle} value={ud?.contact_number || userObj?.contact_number || user?.contact_number || ''} editable={false} />
              <TextInput style={inputStyle} value={ud?.department || ''} editable={false} />
              <TextInput style={inputStyle} value={userObj?.vehicles?.[0]?.vehicle_type || user?.vehicles?.[0]?.vehicle_type || ud?.vehicle_type || ''} editable={false} />
            </View>

            {/* Action Buttons */}
            <View className="mt-4">
              <TouchableOpacity className="bg-[#FFC800] rounded-lg py-3 items-center mb-4" onPress={() => router.push({ pathname: '/main-home/files' } as any)}>
                <Text className="text-white font-bold">View Files</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-[#C34C4D] rounded-lg py-3 items-center mb-4" onPress={() => router.push('/info-profile/edit-profile')}>
                <Text className="text-white font-bold">Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-[#F5F4F4] rounded-lg py-3 items-center border border-[#C34C4D]" onPress={() => Alert.alert('Logout', 'Please sign out via the app menu (TODO)')}>
                <Text className="text-[#C34C4D] font-bold">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const inputStyle = {
  backgroundColor: 'white',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#C9C9C9',
  paddingHorizontal: 16,
  paddingVertical: 16,
  color: 'black',
  marginBottom: 10,
};

export default Profile;