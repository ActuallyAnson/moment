import React, {useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../theme';
import {px, useFont} from '../ui';

type Props = {label: string; onPress: () => void; preferred?: boolean; ariaLabel?: string; hint?: string};

// Focus is shown with a thick border plus scale and fill (not colour alone) for 10-foot legibility.
export const FocusableButton = ({label, onPress, preferred, ariaLabel, hint}: Props) => {
  const [focused, setFocused] = useState(false);
  const fs = useFont();
  const styles = StyleSheet.create({
    button: {
      paddingVertical: px(20),
      paddingHorizontal: px(30),
      marginBottom: px(18),
      borderRadius: px(14),
      borderWidth: px(6),
      borderColor: 'transparent',
      backgroundColor: colors.buttonBg,
    },
    focused: {borderColor: colors.focusBorder, backgroundColor: colors.accent, transform: [{scale: 1.06}]},
    label: {color: colors.textPrimary, fontSize: fs(36), fontWeight: '600'},
    labelFocused: {color: colors.onAccent},
  });
  return (
    <Pressable
      hasTVPreferredFocus={preferred}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      role="button"
      aria-label={ariaLabel ?? label}
      accessibilityHint={hint}
      style={[styles.button, focused && styles.focused]}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </Pressable>
  );
};
