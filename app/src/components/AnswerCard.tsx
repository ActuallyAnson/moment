import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {formatTime, windowNote} from '../format';
import {colors} from '../theme';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';
import {FocusableButton} from './FocusableButton';
import {Dots} from './Dots';
import type {MomentState} from '../useMoment';

type Props = {
  state: Exclude<MomentState, {phase: 'idle'} | {phase: 'asking'}>;
  onRetry: () => void;
  onDismiss: () => void;
  onAskAgain: () => void;
};

export const AnswerCard = ({state, onRetry, onDismiss, onAskAgain}: Props) => {
  const fs = useFont();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (state.phase !== 'loading') {
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [state.phase]);

  const styles = StyleSheet.create({
    card: {
      position: 'absolute',
      left: px(SAFE_X),
      right: px(SAFE_X),
      bottom: px(SAFE_Y),
      padding: px(40),
      borderRadius: px(20),
      backgroundColor: 'rgba(8,10,16,0.94)',
      zIndex: 20,
    },
    question: {color: colors.accent, fontSize: fs(30), fontWeight: '600', marginBottom: px(12)},
    answer: {color: colors.textPrimary, fontSize: fs(40), lineHeight: fs(56)},
    note: {color: colors.textSecondary, fontSize: fs(28), marginTop: px(16)},
    row: {flexDirection: 'row', marginTop: px(24)},
    gap: {width: px(24)},
  });

  return (
    <TVFocusGuideView autoFocus trapFocusUp trapFocusDown trapFocusLeft trapFocusRight style={styles.card}>
      <Text style={styles.question}>
        {state.question} · {formatTime(state.t)}
      </Text>
      {state.phase === 'loading' && (
        <View>
          <Text style={styles.answer}>{slow ? 'Still thinking…' : 'Looking at the scene…'}</Text>
          <Dots />
        </View>
      )}
      {state.phase === 'answer' && (
        <View>
          <Text style={styles.answer} numberOfLines={5} ellipsizeMode="tail">
            {state.answer}
          </Text>
          <Text style={styles.note}>{windowNote(state.t, state.framesUsed, state.cuesUsed)}</Text>
          <View style={styles.row}>
            <FocusableButton
              label="Ask another"
              preferred
              ariaLabel={`Answer: ${state.answer.replace(/[.!?]+$/, '')}. ${windowNote(state.t, state.framesUsed, state.cuesUsed)}.`}
              onPress={onAskAgain}
            />
            <View style={styles.gap} />
            <FocusableButton label="Resume" onPress={onDismiss} />
          </View>
        </View>
      )}
      {state.phase === 'error' && (
        <View>
          <Text style={styles.answer}>{state.message}</Text>
          <View style={styles.row}>
            <FocusableButton label="Try again" preferred ariaLabel={`${state.message.replace(/[.!?]+$/, '')}.`} onPress={onRetry} />
            <View style={styles.gap} />
            <FocusableButton label="Close" onPress={onDismiss} />
          </View>
        </View>
      )}
      {state.phase === 'loading' && <Text style={styles.note}>Back to cancel</Text>}
    </TVFocusGuideView>
  );
};
