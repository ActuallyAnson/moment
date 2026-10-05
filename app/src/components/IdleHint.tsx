import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';
import {colors} from '../theme';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';

// A small "how to ask" pill: visible at start and after each resume (5 s), and again every 60 s while idle.
export const IdleHint = ({visible}: {visible: boolean}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const fs = useFont();
  useEffect(() => {
    Animated.timing(opacity, {toValue: visible ? 1 : 0, duration: 300, useNativeDriver: false}).start();
  }, [visible, opacity]);
  const styles = StyleSheet.create({
    pill: {
      position: 'absolute',
      top: px(SAFE_Y),
      right: px(SAFE_X),
      paddingVertical: px(14),
      paddingHorizontal: px(26),
      borderRadius: px(12),
      backgroundColor: 'rgba(8,10,16,0.75)',
      zIndex: 15,
    },
    text: {color: colors.textPrimary, fontSize: fs(28)},
  });
  return (
    <Animated.View style={[styles.pill, {opacity}]} aria-hidden={!visible} pointerEvents="none">
      <Text style={styles.text}>Press Menu or Select to ask about this moment</Text>
    </Animated.View>
  );
};
