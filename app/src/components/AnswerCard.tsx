import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from '@amazon-devices/react-linear-gradient';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {dialogueNote, formatTime, windowNote} from '../format';
import {colors, gradients} from '../theme';
import {px, SAFE_X, SAFE_Y, useFont} from '../ui';
import {FocusableButton} from './FocusableButton';
import {Dots} from './Dots';
import type {MomentState} from '../useMoment';

type Props = {
  state: Exclude<MomentState, {phase: 'idle'} | {phase: 'asking'}>;
  onRetry: () => void;
  onDismiss: () => void;
  onAskAgain: () => void;
  onReplay: () => void;
};

const noteFor = (s: {t: number; framesUsed?: number[]; cuesUsed?: number; source?: string}): string =>
  s.source === 'subtitles' ? dialogueNote(s.cuesUsed) : windowNote(s.t, s.framesUsed, s.cuesUsed);

export const AnswerCard = ({state, onRetry, onDismiss, onAskAgain, onReplay}: Props) => {
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
      paddingVertical: px(36),
      paddingLeft: px(52),
      paddingRight: px(44),
      borderRadius: px(28),
      borderWidth: px(2),
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      zIndex: 20,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: px(28),
      bottom: px(28),
      width: px(10),
      borderTopRightRadius: px(6),
      borderBottomRightRadius: px(6),
      backgroundColor: colors.accent,
    },
    question: {color: colors.accent, fontSize: fs(28), fontWeight: '700', letterSpacing: 1, marginBottom: px(12)},
    answer: {color: colors.textPrimary, fontSize: fs(42), lineHeight: fs(58)},
    note: {color: colors.textSecondary, fontSize: fs(28), marginTop: px(18)},
    row: {flexDirection: 'row', marginTop: px(24)},
    gap: {width: px(24)},
  });

  return (
    <TVFocusGuideView autoFocus trapFocusUp trapFocusDown trapFocusLeft trapFocusRight style={styles.card}>
      <LinearGradient colors={gradients.card} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
      <View style={styles.accentBar} aria-hidden />
      <Text style={styles.question}>
        {state.question.toUpperCase()} · {formatTime(state.t)}
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
          <Text style={styles.note}>{noteFor(state)}</Text>
          <View style={styles.row}>
            <FocusableButton
              label="Ask another"
              preferred
              ariaLabel={`Answer: ${state.answer.replace(/[.!?]+$/, '')}. ${noteFor(state)}.`}
              onPress={onAskAgain}
            />
            <View style={styles.gap} />
            <FocusableButton label="Replay 10 s" ariaLabel="Replay the last 10 seconds" onPress={onReplay} />
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
