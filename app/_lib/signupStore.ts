// Simple shared signup store placed outside the route tree so the router doesn't treat it as a route.
type SignupData = {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  firstname?: string;
  middlename?: string;
  lastname?: string;
  contact_number?: string;
  department?: string;
  plate_number?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  brand?: string;
  model?: string;
  id_path?: string;
  id_number?: string;
  face_score?: number;
  face_verified?: boolean;
  // face verification fields removed
  selfie_path?: string;
  id_name?: string;
  or_file?: any;
  cr_file?: any;
  // picked document URIs (expo DocumentPicker returns a uri string)
  or_path?: string;
  cr_path?: string;
  or_name?: string;
  cr_name?: string;
  or_number?: string;
  cr_number?: string;
  // second-hand / deed of sale
  is_second_hand?: boolean;
  deed_path?: string;
  deed_name?: string;
  // role-specific
  student_no?: string;
  course?: string;
  yr_section?: string;
  faculty_id?: string;
  employee_id?: string;
  position?: string;
}

const data: SignupData = {};

export function setSignup(partial: Partial<SignupData>) {
  Object.assign(data, partial);
}

export function getSignup(): SignupData {
  return data;
}

export function resetSignup() {
  for (const k of Object.keys(data)) delete (data as any)[k];
}

