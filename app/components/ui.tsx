import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

type BtnProps = { title: string; onPress?: () => void; style?: any; disabled?: boolean };

export const PrimaryButton = ({ title, onPress, style, disabled }: BtnProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.primary, style, disabled ? styles.disabled : null]} activeOpacity={0.85} disabled={disabled}>
    <Text style={styles.primaryText}>{title}</Text>
  </TouchableOpacity>
);

export const SecondaryButton = ({ title, onPress, style, disabled }: BtnProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.secondary, style, disabled ? styles.disabled : null]} activeOpacity={0.85} disabled={disabled}>
    <Text style={styles.secondaryText}>{title}</Text>
  </TouchableOpacity>
);

export const Card = ({ children, style }: { children: any; style?: any }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.headerWrap}>
    <Text style={styles.headerTitle}>{title}</Text>
    {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  primary: { backgroundColor: '#C34C4D', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { borderWidth: 1, borderColor: '#C34C4D', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center' },
  secondaryText: { color: '#C34C4D', fontWeight: '700' },
  // style applied to disabled buttons (used conditionally in components)
  disabled: { opacity: 0.6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  headerWrap: { paddingVertical: 18, paddingHorizontal: 12, backgroundColor: '#F9FAFB' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 }
});

export default {};
