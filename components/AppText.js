import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import { Picker as NativePicker } from '@react-native-picker/picker';

function getFontFamily(style) {
  const { fontStyle, fontWeight } = StyleSheet.flatten(style) ?? {};
  if (fontStyle === 'italic' && (!fontWeight || fontWeight === 'normal' || fontWeight === '400')) {
    return 'FiraSans_400Regular_Italic';
  }

  switch (fontWeight) {
    case '600':
      return 'FiraSans_600SemiBold';
    case '700':
    case 'bold':
      return 'FiraSans_700Bold';
    case '800':
      return 'FiraSans_800ExtraBold';
    default:
      return 'FiraSans_400Regular';
  }
}

export const AppText = forwardRef(function AppText({ style, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={[style, { fontFamily: getFontFamily(style) }]} />;
});

export const AppTextInput = forwardRef(function AppTextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={[style, { fontFamily: getFontFamily(style) }]} />;
});

export const AppPicker = forwardRef(function AppPicker({ style, itemStyle, ...props }, ref) {
  return (
    <NativePicker
      ref={ref}
      {...props}
      style={[style, { fontFamily: getFontFamily(style) }]}
      itemStyle={[itemStyle, { fontFamily: getFontFamily(itemStyle) }]}
    />
  );
});

export function AppButton({ title, onPress, color, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: color || '#4c669f',
        borderRadius: 5,
        opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        paddingHorizontal: 14,
        paddingVertical: 9,
      })}
    >
      <AppText style={{ color: '#ffffff', fontWeight: '600' }}>{title}</AppText>
    </Pressable>
  );
}