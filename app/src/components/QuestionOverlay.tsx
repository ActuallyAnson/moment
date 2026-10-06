import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from '@amazon-devices/react-linear-gradient';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {QUESTIONS} from '../questions';
import {formatTime, spokenTime} from '../format';
import {colors, gradients} from '../theme';
import {QuestionIcon} from './QuestionIcon';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';
import {FocusableButton} from './FocusableButton';

type Props = {t: number; onChoose: (question: string) => void; large: boolean; onToggleLarge: () => void};

export const QuestionOverlay = ({t, onChoose, large, onToggleLarge}: Props) => {
  const fs = useFont();
  const styles = StyleSheet.create({
    panel: {
      position: 'absolute',
      top: px(SAFE_Y + 10),
      bottom: px(SAFE_Y),
      right: px(SAFE_X),
      width: px(780),
      paddingHorizontal: px(44),
      paddingVertical: px(36),
      borderRadius: px(28),
      borderWidth: px(2),
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      zIndex: 20,
      justifyContent: 'center',
    },
    kicker: {color: colors.accent, fontSize: fs(28), fontWeight: '700', letterSpacing: 1},
    title: {color: colors.textPrimary, fontSize: fs(48), fontWeight: '700', marginTop: px(4), marginBottom: px(26)},
    footer: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: px(8)},
    hint: {color: colors.textSecondary, fontSize: fs(28)},
  });
  return (
    <TVFocusGuideView autoFocus trapFocusUp trapFocusDown trapFocusLeft trapFocusRight style={styles.panel}>
      <LinearGradient colors={gradients.card} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
      <View
        accessible
        aria-label={`Ask about this moment. Paused at ${spokenTime(t)}. ${QUESTIONS.length} questions. Press back to resume.`}>
        <Text style={styles.kicker}>PAUSED AT {formatTime(t)}</Text>
        <Text style={styles.title}>Ask about this moment</Text>
      </View>
      <View>
        {QUESTIONS.map((q, i) => (
          <FocusableButton
            key={q}
            label={q}
            preferred={i === 0}
            hint={i === 0 ? 'Asks about the last few seconds of the video' : undefined}
            icon={(c) => <QuestionIcon question={q} color={c} size={px(34)} />}
            onPress={() => onChoose(q)}
          />
        ))}
      </View>
      <View style={styles.footer}>
        <FocusableButton secondary label={large ? 'Larger text: on' : 'Larger text'} onPress={onToggleLarge} />
        <Text style={styles.hint}>Back to resume</Text>
      </View>
    </TVFocusGuideView>
  );
};
