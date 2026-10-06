import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {KeplerVideoSurfaceView} from '@amazon-devices/react-native-w3cmedia';
import LinearGradient from '@amazon-devices/react-linear-gradient';
import {usePlayer} from './usePlayer';
import {useMoment} from './useMoment';
import {TextScaleContext} from './ui';
import {gradients} from './theme';
import {CLIPS} from './clips';
import {QuestionOverlay} from './components/QuestionOverlay';
import {AnswerCard} from './components/AnswerCard';
import {IdleHint} from './components/IdleHint';
import {PausedBadge} from './components/PausedBadge';
import {ReplayToast} from './components/ReplayToast';
import {ClipPicker} from './components/ClipPicker';

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

type PlayerScreenProps = {clipId: string; large: boolean; onToggleLarge: () => void; onExit: () => void};

// One clip: video, hint, question panel, answer card. Remounted (key = clip id) when the viewer picks another clip.
const PlayerScreen = ({clipId, large, onToggleLarge, onExit}: PlayerScreenProps) => {
  const clip = CLIPS.find((c) => c.id === clipId) ?? CLIPS[0];
  const player = usePlayer(clip.file);
  const {state, choose, dismiss, askAgain, replay, toast} = useMoment(clip.id, player, onExit);
  const hint = useIdleHint(state.phase === 'idle');

  return (
    <View style={styles.root}>
      <KeplerVideoSurfaceView
        style={styles.video}
        onSurfaceViewCreated={player.onSurfaceViewCreated}
        onSurfaceViewDestroyed={player.onSurfaceViewDestroyed}
      />
      <IdleHint visible={hint} />
      {state.phase === 'asking' && (
        <LinearGradient colors={gradients.scrimRight} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.dim} pointerEvents="none" />
      )}
      {(state.phase === 'loading' || state.phase === 'answer' || state.phase === 'error') && (
        <LinearGradient colors={gradients.scrimBottom} start={{x: 0, y: 0.35}} end={{x: 0, y: 1}} style={styles.dim} pointerEvents="none" />
      )}
      {state.phase !== 'idle' && <PausedBadge />}
      {toast && <ReplayToast text={toast} />}
      {state.phase === 'asking' && (
        <QuestionOverlay t={state.t} onChoose={(q) => choose(q, state.t)} large={large} onToggleLarge={onToggleLarge} />
      )}
      {(state.phase === 'loading' || state.phase === 'answer' || state.phase === 'error') && (
        <AnswerCard
          state={state}
          onRetry={() => choose(state.question, state.t)}
          onDismiss={dismiss}
          onAskAgain={askAgain}
          onReplay={replay}
        />
      )}
    </View>
  );
};

export const App = () => {
  const [clipId, setClipId] = useState<string | null>(null);
  const [large, setLarge] = useState(false); // text size toggle, in memory only
  return (
    <TextScaleContext.Provider value={large ? 1.25 : 1}>
      {clipId ? (
        <PlayerScreen key={clipId} clipId={clipId} large={large} onToggleLarge={() => setLarge((v) => !v)} onExit={() => setClipId(null)} />
      ) : (
        <ClipPicker onPick={setClipId} />
      )}
    </TextScaleContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'black'},
  video: {...StyleSheet.absoluteFillObject, zIndex: 0},
  dim: {...StyleSheet.absoluteFillObject, zIndex: 10},
});
