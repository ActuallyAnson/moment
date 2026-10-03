import React, {useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

type Props = {label: string; onPress: () => void; preferred?: boolean};

// Focus is shown with a thick border plus scale (not colour alone) for 10-foot legibility.
export const FocusableButton = ({label, onPress, preferred}: Props) => {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      hasTVPreferredFocus={preferred}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={[styles.button, focused && styles.focused]}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 22,
    paddingHorizontal: 32,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 6,
    borderColor: 'transparent',
    backgroundColor: '#2b2f3a',
  },
  focused: {
    borderColor: '#ffffff',
    backgroundColor: '#ffb020',
    transform: [{scale: 1.06}],
  },
  label: {color: '#ffffff', fontSize: 40, fontWeight: '600'},
  labelFocused: {color: '#101010'},
});
