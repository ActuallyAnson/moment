import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {QUESTIONS} from '../questions';
import {formatTime, spokenTime} from '../format';
import {colors} from '../theme';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';
import {FocusableButton} from './FocusableButton';

type Props = {t: number; onChoose: (question: string) => void; large: boolean; onToggleLarge: () => void};

export const QuestionOverlay = ({t, onChoose, large, onToggleLarge}: Props) => {
  const fs = useFont();
  const styles = StyleSheet.create({
    panel: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      width: px(820 + SAFE_X),
      paddingLeft: px(56),
      paddingRight: px(SAFE_X),
      paddingVertical: px(SAFE_Y),
      backgroundColor: 'rgba(8,10,16,0.92)',
      zIndex: 20,
      justifyContent: 'center',
    },
    title: {color: colors.textPrimary, fontSize: fs(48), fontWeight: '700'},
    sub: {color: colors.textSecondary, fontSize: fs(30), marginBottom: px(30), marginTop: px(6)},
    hint: {color: colors.textSecondary, fontSize: fs(28), marginTop: px(12)},
  });
  return (
    <TVFocusGuideView autoFocus trapFocusUp trapFocusDown trapFocusLeft trapFocusRight style={styles.panel}>
      <View
        accessible
        aria-label={`Ask about this moment. Paused at ${spokenTime(t)}. Four questions. Press back to resume.`}>
        <Text style={styles.title}>Ask about this moment</Text>
        <Text style={styles.sub}>Paused at {formatTime(t)}</Text>
      </View>
      <View>
        {QUESTIONS.map((q, i) => (
          <FocusableButton
            key={q}
            label={q}
            preferred={i === 0}
            hint={i === 0 ? 'Asks about the last few seconds of the video' : undefined}
            onPress={() => onChoose(q)}
          />
        ))}
        <FocusableButton label={large ? 'Text size: Larger (on)' : 'Text size: Larger'} onPress={onToggleLarge} />
      </View>
      <Text style={styles.hint}>Back to resume</Text>
    </TVFocusGuideView>
  );
};
