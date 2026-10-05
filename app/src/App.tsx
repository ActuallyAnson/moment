import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {KeplerVideoSurfaceView} from '@amazon-devices/react-native-w3cmedia';
import {usePlayer} from './usePlayer';
import {useMoment} from './useMoment';
import {TextScaleContext} from './ui';
import {QuestionOverlay} from './components/QuestionOverlay';
import {AnswerCard} from './components/AnswerCard';
import {IdleHint} from './components/IdleHint';
import {PausedBadge} from './components/PausedBadge';
import {colors} from './theme';

const useIdleHint = (idle: boolean): boolean => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!idle) {
      setVisible(false);
      return undefined;
    }
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 5000);
    const again = setInterval(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 60000);
    return () => {
      clearTimeout(hide);
      clearInterval(again);
    };
  }, [idle]);
  return visible;
};

export const App = () => {
  const player = usePlayer();
  const {state, choose, dismiss, askAgain} = useMoment(player);
  const [large, setLarge] = useState(false); // text size toggle, in memory only
  const hint = useIdleHint(state.phase === 'idle');

  return (
    <TextScaleContext.Provider value={large ? 1.25 : 1}>
      <View style={styles.root}>
        <KeplerVideoSurfaceView
          style={styles.video}
          onSurfaceViewCreated={player.onSurfaceViewCreated}
          onSurfaceViewDestroyed={player.onSurfaceViewDestroyed}
        />
        <IdleHint visible={hint} />
        {state.phase !== 'idle' && <View style={styles.dim} pointerEvents="none" />}
        {state.phase !== 'idle' && <PausedBadge />}
        {state.phase === 'asking' && (
          <QuestionOverlay t={state.t} onChoose={(q) => choose(q, state.t)} large={large} onToggleLarge={() => setLarge((v) => !v)} />
        )}
        {(state.phase === 'loading' || state.phase === 'answer' || state.phase === 'error') && (
          <AnswerCard state={state} onRetry={() => choose(state.question, state.t)} onDismiss={dismiss} onAskAgain={askAgain} />
        )}
      </View>
    </TextScaleContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'black'},
  video: {...StyleSheet.absoluteFillObject, zIndex: 0},
  dim: {...StyleSheet.absoluteFillObject, backgroundColor: colors.dim, zIndex: 10},
});
