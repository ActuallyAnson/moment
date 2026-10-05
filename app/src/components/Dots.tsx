import React, {useEffect, useRef} from 'react';
import {Animated, View} from 'react-native';
import {colors} from '../theme';
import {px} from '../ui';

// Three pulsing dots: "working", not a progress bar (there is no real progress to show).
export const Dots = () => {
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0.4))).current;
  useEffect(() => {
    const loops = vals.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(v, {toValue: 1, duration: 450, useNativeDriver: false}),
          Animated.timing(v, {toValue: 0.4, duration: 450, useNativeDriver: false}),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [vals]);
  return (
    <View style={{flexDirection: 'row', marginTop: px(20)}} aria-hidden>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={{width: px(24), height: px(24), borderRadius: px(12), marginRight: px(16), backgroundColor: colors.accent, opacity: v}}
        />
      ))}
    </View>
  );
};
