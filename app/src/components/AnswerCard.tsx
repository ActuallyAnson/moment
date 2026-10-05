import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {formatTime} from '../format';
import {FocusableButton} from './FocusableButton';
import type {MomentState} from '../useMoment';

type Props = {
  state: Exclude<MomentState, {phase: 'idle'} | {phase: 'asking'}>;
  onRetry: () => void;
  onDismiss: () => void;
};

export const AnswerCard = ({state, onRetry, onDismiss}: Props) => {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (state.phase !== 'loading') {
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [state.phase]);
  return (
  <TVFocusGuideView
    autoFocus
    trapFocusUp
    trapFocusDown
    trapFocusLeft
    trapFocusRight
    style={styles.card}>
    <Text style={styles.question}>
      {state.question} · {formatTime(state.t)}
    </Text>
    {state.phase === 'loading' && (
      <Text style={styles.answer}>{slow ? 'Still thinking…' : 'Looking at the scene…'}</Text>
    )}
    {state.phase === 'answer' && <Text style={styles.answer}>{state.answer}</Text>}
    {state.phase === 'error' && (
      <View>
        <Text style={styles.answer}>{state.message}</Text>
        <View style={styles.row}>
          <FocusableButton label="Try again" preferred onPress={onRetry} />
          <FocusableButton label="Close" onPress={onDismiss} />
        </View>
      </View>
    )}
    {state.phase !== 'error' && <Text style={styles.hint}>Press Back to resume</Text>}
  </TVFocusGuideView>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 60,
    padding: 44,
    borderRadius: 20,
    backgroundColor: 'rgba(8,10,16,0.94)',
    zIndex: 20,
  },
  question: {color: '#ffb020', fontSize: 32, fontWeight: '600', marginBottom: 14},
  answer: {color: '#ffffff', fontSize: 46, lineHeight: 60},
  hint: {color: '#c8ccd6', fontSize: 28, marginTop: 22},
  row: {flexDirection: 'row', gap: 24, marginTop: 28},
});
