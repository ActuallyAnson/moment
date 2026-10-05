import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from '@amazon-devices/react-linear-gradient';
import {colors, gradients} from '../theme';
import {px, useFont} from '../ui';

type Props = {
  label: string;
  onPress: () => void;
  preferred?: boolean;
  ariaLabel?: string;
  hint?: string;
  secondary?: boolean; // smaller, outlined: for controls that are not questions
  icon?: (color: string) => React.ReactNode;
};

// Focus is shown with a thick border plus scale and fill (not colour alone) for 10-foot legibility.
export const FocusableButton = ({label, onPress, preferred, ariaLabel, hint, secondary, icon}: Props) => {
  const [focused, setFocused] = useState(false);
  const fs = useFont();
  const styles = StyleSheet.create({
    button: {
      marginBottom: px(secondary ? 0 : 14),
      borderRadius: px(16),
      borderWidth: px(5),
      borderColor: secondary ? colors.cardBorder : 'transparent',
      backgroundColor: secondary ? 'transparent' : colors.buttonBg,
      alignSelf: secondary ? 'flex-start' : 'stretch',
      overflow: 'hidden',
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: px(secondary ? 12 : 18),
      paddingHorizontal: px(secondary ? 24 : 28),
    },
    iconBox: {marginRight: px(20)},
    focused: {borderColor: colors.focusBorder, transform: [{scale: 1.05}]},
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
      {focused && <LinearGradient colors={gradients.focus} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />}
      <View style={styles.inner}>
        {icon && <View style={styles.iconBox}>{icon(focused ? colors.onAccent : colors.accent)}</View>}
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      </View>
    </Pressable>
  );
};
