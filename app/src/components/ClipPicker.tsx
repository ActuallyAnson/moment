import React, {useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from '@amazon-devices/react-linear-gradient';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {CLIPS} from '../clips';
import {POSTERS} from '../posters';
import {colors, gradients} from '../theme';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';

type CardProps = {id: string; title: string; credit: string; preferred: boolean; onFocus: () => void; onPress: () => void; ariaLabel: string};

const ClipCard = ({id, title, credit, preferred, onFocus, onPress, ariaLabel}: CardProps) => {
  const [focused, setFocused] = useState(false);
  const fs = useFont();
  const styles = StyleSheet.create({
    card: {
      width: px(536),
      height: px(280),
      marginRight: px(40),
      marginBottom: px(40),
      borderRadius: px(24),
      borderWidth: px(5),
      borderColor: focused ? colors.focusBorder : colors.cardBorder,
      backgroundColor: colors.buttonBg,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      paddingHorizontal: px(28),
      paddingBottom: px(22),
      transform: [{scale: focused ? 1.05 : 1}],
    },
    title: {color: colors.textPrimary, fontSize: fs(38), fontWeight: '700'},
    credit: {color: focused ? colors.accent : colors.textSecondary, fontSize: fs(28), marginTop: px(4), fontWeight: focused ? '700' : '400'},
  });
  return (
    <Pressable
      hasTVPreferredFocus={preferred}
      onFocus={() => {
        setFocused(true);
        onFocus();
      }}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      role="button"
      aria-label={ariaLabel}
      style={styles.card}>
      <Image source={POSTERS[id]} style={StyleSheet.absoluteFill} resizeMode="cover" aria-hidden />
      <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(5,6,12,0.92)']} start={{x: 0, y: 0.2}} end={{x: 0, y: 1}} style={StyleSheet.absoluteFill} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.credit}>{credit}</Text>
    </Pressable>
  );
};

// Start screen: pick one of the bundled clips. The credit line for the focused clip is shown in full at the bottom.
export const ClipPicker = ({onPick}: {onPick: (clipId: string) => void}) => {
  const fs = useFont();
  const [focusedId, setFocusedId] = useState(CLIPS[0].id);
  const focused = CLIPS.find((c) => c.id === focusedId) ?? CLIPS[0];
  const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#0b0d14', paddingHorizontal: px(SAFE_X), paddingTop: px(SAFE_Y), paddingBottom: px(SAFE_Y)},
    kicker: {color: colors.accent, fontSize: fs(28), fontWeight: '700', letterSpacing: 2},
    title: {color: colors.textPrimary, fontSize: fs(64), fontWeight: '800', marginTop: px(6)},
    sub: {color: colors.textSecondary, fontSize: fs(32), marginTop: px(10), marginBottom: px(36)},
    grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: px(8)},
    footer: {position: 'absolute', left: px(SAFE_X), right: px(SAFE_X), bottom: px(SAFE_Y)},
    credit: {color: colors.textSecondary, fontSize: fs(28)},
  });
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#141a2e', '#0b0d14']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
      <TVFocusGuideView autoFocus>
        <Text style={styles.kicker}>MOMENT</Text>
        <Text style={styles.title}>Pick a clip</Text>
        <Text style={styles.sub}>Then press Menu at any moment to ask about it.</Text>
        <View style={styles.grid}>
          {CLIPS.map((c, i) => (
            <ClipCard
              key={c.id}
              id={c.id}
              title={c.title}
              credit={c.license.split(' (')[0]}
              preferred={i === 0}
              onFocus={() => setFocusedId(c.id)}
              onPress={() => onPick(c.id)}
              ariaLabel={`${c.title}. ${c.license}. Press select to play.`}
            />
          ))}
        </View>
      </TVFocusGuideView>
      <View style={styles.footer}>
        <Text style={styles.credit}>
          {focused.title}: {focused.attribution}, {focused.license}. Audio removed.
        </Text>
      </View>
    </View>
  );
};
