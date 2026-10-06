import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';

// A short confirmation after "Replay 10 s" (same look as the idle hint pill, top-left).
export const ReplayToast = ({text}: {text: string}) => {
  const fs = useFont();
  const styles = StyleSheet.create({
    pill: {
      position: 'absolute',
      top: px(SAFE_Y),
      left: px(SAFE_X),
      paddingVertical: px(14),
      paddingHorizontal: px(26),
      borderRadius: px(999),
      backgroundColor: 'rgba(14,16,24,0.85)',
      borderWidth: px(2),
      borderColor: colors.cardBorder,
      zIndex: 25,
    },
    text: {color: colors.textPrimary, fontSize: fs(28), fontWeight: '600'},
  });
  return (
    <View style={styles.pill} aria-live="polite">
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};
