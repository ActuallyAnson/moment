import {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler} from 'react-native';
import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import {ask, AskError} from './api';

export type MomentState =
  | {phase: 'idle'}
  | {phase: 'asking'; t: number}
  | {phase: 'loading'; t: number; question: string}
  | {phase: 'answer'; t: number; question: string; answer: string; framesUsed?: number[]; cuesUsed?: number}
  | {phase: 'error'; t: number; question: string; message: string};

type Controls = {currentTime: () => number; pause: () => void; play: () => void};

// Remote behaviour (acts on key-up so the release of the opening key cannot hit the new focus target):
//   idle:            Menu / Select open the overlay and pause; Back is left to the OS; other keys are the player's.
//   asking:          Select picks the focused question; Menu / Back / Play-Pause close and resume.
//   loading:         Back / Play-Pause cancel and resume (a late reply is dropped).
//   answer / error:  Select presses the focused button; Menu re-opens the questions at the same moment;
//                    Back / Play-Pause close and resume.
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

  const askAgain = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'answer' || s.phase === 'error') {
      requestId.current += 1;
      setState({phase: 'asking', t: s.t}); // video stays paused at the same moment
    }
  }, []);

  const choose = useCallback(async (question: string, t: number) => {
    const id = ++requestId.current;
    setState({phase: 'loading', t, question});
    try {
      const res = await ask(question, t);
      if (id === requestId.current) {
        setState({phase: 'answer', t, question, answer: res.answer, framesUsed: res.framesUsed, cuesUsed: res.cuesUsed});
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
    const phase = stateRef.current.phase;
    const type = evt.eventType;
    if (phase === 'idle') {
      if (type === 'menu' || type === 'select') {
        open();
      }
      return;
    }
    if (type === 'menu') {
      if (phase === 'asking') {
        dismiss();
      } else if (phase === 'answer' || phase === 'error') {
        askAgain();
      }
    } else if (type === 'play' || type === 'pause' || type === 'playpause') {
      // The VVD's Play/Pause key arrives as 'play' (measured with a key logger); accept all three names.
      dismiss();
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

  return {state, choose, dismiss, askAgain};
};
