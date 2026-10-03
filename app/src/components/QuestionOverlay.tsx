import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {QUESTIONS} from '../questions';
import {formatTime} from '../format';
import {FocusableButton} from './FocusableButton';

type Props = {t: number; onChoose: (question: string) => void};

export const QuestionOverlay = ({t, onChoose}: Props) => (
  <TVFocusGuideView
    autoFocus
    trapFocusUp
    trapFocusDown
    trapFocusLeft
    trapFocusRight
    style={styles.panel}>
    <Text style={styles.title}>Ask about this moment</Text>
    <Text style={styles.sub}>Paused at {formatTime(t)}</Text>
    <View>
      {QUESTIONS.map((q, i) => (
        <FocusableButton key={q} label={q} preferred={i === 0} onPress={() => onChoose(q)} />
      ))}
    </View>
    <Text style={styles.hint}>Press Back to resume</Text>
  </TVFocusGuideView>
);

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 860,
    paddingHorizontal: 60,
    paddingVertical: 60,
    backgroundColor: 'rgba(8,10,16,0.92)',
    zIndex: 20,
    justifyContent: 'center',
  },
  title: {color: '#ffffff', fontSize: 52, fontWeight: '700'},
  sub: {color: '#c8ccd6', fontSize: 30, marginBottom: 36, marginTop: 6},
  hint: {color: '#c8ccd6', fontSize: 28, marginTop: 20},
});
