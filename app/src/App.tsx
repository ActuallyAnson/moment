import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {KeplerVideoSurfaceView, VideoPlayer} from '@amazon-devices/react-native-w3cmedia';

// Phase 0 spike: play a bundled clip, read currentTime, pause at 5 s, resume 2 s later.
const CLIP_SRC = '/pkg/assets/raw/clip.mp4';

export const App = () => {
  const playerRef = useRef<VideoPlayer | null>(null);
  const [status, setStatus] = useState('initializing');
  const [time, setTime] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const pausedOnce = useRef(false);
  const surfaceReady = useRef(false);
  const metaReady = useRef(false);
  const started = useRef(false);

  const tryStart = () => {
    const p = playerRef.current;
    if (p && surfaceReady.current && metaReady.current && !started.current) {
      started.current = true;
      p.play();
      setStatus('playing');
      note('play()');
    }
  };

  const note = (msg: string) => {
    console.log(`[moment] ${msg}`);
    setLog((l) => [...l.slice(-5), msg]);
  };

  useEffect(() => {
    const player = new VideoPlayer();
    playerRef.current = player;
    player
      .initialize()
      .then(() => {
        player.src = CLIP_SRC;
        player.addEventListener('error', () => note(`error: ${JSON.stringify(player.error)}`));
        player.addEventListener('loadedmetadata', () => {
          note(`loaded, duration ${player.duration}`);
          metaReady.current = true;
          tryStart();
        });
        setStatus('loading');
      })
      .catch((e: unknown) => note(`init failed: ${String(e)}`));

    const timer = setInterval(() => {
      const p = playerRef.current;
      if (!p) {
        return;
      }
      setTime(p.currentTime);
      if (!pausedOnce.current && p.currentTime >= 5) {
        pausedOnce.current = true;
        p.pause();
        note(`paused at ${p.currentTime.toFixed(2)}s`);
        setStatus('paused');
        setTimeout(() => {
          p.play();
          note('resumed');
          setStatus('playing');
        }, 2000);
      }
    }, 250);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const onSurfaceViewCreated = (handle: string) => {
    playerRef.current?.setSurfaceHandle(handle);
    surfaceReady.current = true;
    note('surface created');
    tryStart();
  };

  const onSurfaceViewDestroyed = () => {
    surfaceReady.current = false;
    playerRef.current?.clearSurfaceHandle(null);
  };

  return (
    <View style={styles.root}>
      <KeplerVideoSurfaceView
        style={styles.video}
        onSurfaceViewCreated={onSurfaceViewCreated}
        onSurfaceViewDestroyed={onSurfaceViewDestroyed}
      />
      <View style={styles.hud}>
        <Text style={styles.hudText}>
          {status} · t={time.toFixed(2)}s
        </Text>
        {log.map((l, i) => (
          <Text key={i} style={styles.logText}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'black'},
  video: {...StyleSheet.absoluteFillObject, zIndex: 0},
  hud: {position: 'absolute', top: 40, left: 60, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 16},
  hudText: {color: 'white', fontSize: 36},
  logText: {color: '#ffd', fontSize: 24},
});
