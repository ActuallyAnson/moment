import React, {useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {colors} from '../theme';
import {px, useFont} from '../ui';

type Props = {
  label: string;
  onPress: () => void;
  preferred?: boolean;
  ariaLabel?: string;
  hint?: string;
  secondary?: boolean; // smaller, outlined: for controls that are not questions
};

// Focus is shown with a thick border plus scale and fill (not colour alone) for 10-foot legibility.
export const FocusableButton = ({label, onPress, preferred, ariaLabel, hint, secondary}: Props) => {
  const [focused, setFocused] = useState(false);
  const fs = useFont();
  const styles = StyleSheet.create({
    button: {
      paddingVertical: px(secondary ? 12 : 20),
      paddingHorizontal: px(secondary ? 24 : 30),
      marginBottom: px(secondary ? 0 : 14),
      borderRadius: px(16),
      borderWidth: px(5),
      borderColor: secondary ? colors.cardBorder : 'transparent',
      backgroundColor: secondary ? 'transparent' : colors.buttonBg,
      alignSelf: secondary ? 'flex-start' : 'stretch',
    },
    focused: {borderColor: colors.focusBorder, backgroundColor: colors.accent, transform: [{scale: 1.05}]},
    label: {color: colors.textPrimary, fontSize: fs(secondary ? 28 : 36), fontWeight: secondary ? '500' : '600'},
    labelFocused: {color: colors.onAccent, fontWeight: '700'},
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
