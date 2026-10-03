import {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {ask, AskError} from './api';

export type MomentState =
  | {phase: 'idle'}
  | {phase: 'asking'; t: number}
  | {phase: 'loading'; t: number; question: string}
  | {phase: 'answer'; t: number; question: string; answer: string}
  | {phase: 'error'; t: number; question: string; message: string};

type Controls = {currentTime: () => number; pause: () => void; play: () => void};

// Ask key = Menu (VVD keyboard: F2). Select also opens the overlay while idle.
// We act on key-up (eventKeyAction === 1) so the release of the opening key
// cannot land on the freshly focused first button.
export const useMoment = ({currentTime, pause, play}: Controls) => {
  const [state, setState] = useState<MomentState>({phase: 'idle'});
  const stateRef = useRef(state);
  stateRef.current = state;
  const requestId = useRef(0);

  const open = useCallback(() => {
    // Read the time BEFORE pausing: currentTime has been observed to read 0 right after pause().
    const t = currentTime();
    pause();
    setState({phase: 'asking', t});
  }, [pause, currentTime]);

  const dismiss = useCallback(() => {
    requestId.current += 1; // drop any in-flight reply
    setState({phase: 'idle'});
    play();
  }, [play]);

  const choose = useCallback(async (question: string, t: number) => {
    const id = ++requestId.current;
    setState({phase: 'loading', t, question});
    try {
      const res = await ask(question, t);
      if (id === requestId.current) {
        setState({phase: 'answer', t, question, answer: res.answer});
      }
    } catch (e) {
      if (id === requestId.current) {
        const message = e instanceof AskError ? e.message : 'Something went wrong.';
        setState({phase: 'error', t, question, message});
      }
    }
  }, []);

  useTVEventHandler((evt: {eventType?: string; eventKeyAction?: number}) => {
    if (evt.eventKeyAction !== 1) {
      return;
    }
    if (stateRef.current.phase === 'idle' && (evt.eventType === 'menu' || evt.eventType === 'select')) {
      open();
    }
  });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stateRef.current.phase === 'idle') {
        return false; // let the OS handle Back from the player
      }
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [dismiss]);

  return {state, choose, dismiss};
};
