import React from 'react';
import {StyleSheet, View} from 'react-native';
import {KeplerVideoSurfaceView} from '@amazon-devices/react-native-w3cmedia';
import {usePlayer} from './usePlayer';
import {useMoment} from './useMoment';
import {QuestionOverlay} from './components/QuestionOverlay';
import {AnswerCard} from './components/AnswerCard';

export const App = () => {
  const player = usePlayer();
  const {state, choose, dismiss} = useMoment(player);

  return (
    <View style={styles.root}>
      <KeplerVideoSurfaceView
        style={styles.video}
        onSurfaceViewCreated={player.onSurfaceViewCreated}
        onSurfaceViewDestroyed={player.onSurfaceViewDestroyed}
      />
      {state.phase === 'asking' && (
        <QuestionOverlay t={state.t} onChoose={(q) => choose(q, state.t)} />
      )}
      {(state.phase === 'loading' || state.phase === 'answer' || state.phase === 'error') && (
        <AnswerCard state={state} onRetry={() => choose(state.question, state.t)} onDismiss={dismiss} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'black'},
  video: {...StyleSheet.absoluteFillObject, zIndex: 0},
});
