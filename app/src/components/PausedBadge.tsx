import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';

// Top-left "Paused" pill with a pause glyph (two bars), shown whenever Moment has paused the video.
export const PausedBadge = () => {
  const fs = useFont();
  const styles = StyleSheet.create({
    pill: {
      position: 'absolute',
      top: px(SAFE_Y),
      left: px(SAFE_X),
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: px(12),
      paddingHorizontal: px(24),
      borderRadius: px(999),
      backgroundColor: 'rgba(14,16,24,0.85)',
      borderWidth: px(2),
      borderColor: colors.cardBorder,
      zIndex: 25,
    },
    bars: {flexDirection: 'row', marginRight: px(14)},
    bar: {width: px(8), height: px(26), borderRadius: px(3), backgroundColor: colors.accent, marginRight: px(6)},
    text: {color: colors.textPrimary, fontSize: fs(28), fontWeight: '600', letterSpacing: 1},
  });
  return (
    <View style={styles.pill} aria-hidden>
      <View style={styles.bars}>
        <View style={styles.bar} />
        <View style={styles.bar} />
      </View>
      <Text style={styles.text}>PAUSED</Text>
    </View>
  );
};
