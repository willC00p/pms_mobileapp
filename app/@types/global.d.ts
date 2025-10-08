declare module 'react-native-vector-icons/Ionicons' {
  const Ionicons: any;
  export default Ionicons;
}

declare module 'lucide-react-native' {
  // Common icons used across the app (fallback to any for editor)
  export const Bell: any;
  export const AlertTriangle: any;
  export const MessageCircle: any;
  export const ParkingCircle: any;
  export const PhoneCall: any;
  export const Home: any;
  export const Phone: any;
  export const QrCode: any;
  export const User: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const Info: any;
  export const Menu: any;
  export const Settings: any;
  export const TriangleAlert: any;
  const _default: any;
  export default _default;
}

declare module 'react/jsx-runtime' {
  const jsx: any;
  export = jsx;
}

declare module '@/components/Hamburger-menu' {
  const comp: any;
  export default comp;
}

declare module 'expo-router' {
  export const Tabs: any;
  export function useRouter(): any;
  export function useLocalSearchParams(): any;
  // Provide both named and default Link exports. Use a straightforward export declaration
  // form to avoid Metro/Babel parsing peculiarities when .d.ts files are scanned.
  export const Link: any;
  export default Link;
}
