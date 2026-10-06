import {useCallback, useEffect, useRef} from 'react';
import {VideoPlayer} from '@amazon-devices/react-native-w3cmedia';

// Owns the video player for one bundled clip file. Playback starts only once the surface exists AND the
// metadata has loaded; calling play() earlier silently does nothing.
export const usePlayer = (src: string) => {
  const player = useRef<VideoPlayer | null>(null);
  const surfaceReady = useRef(false);
  const metaReady = useRef(false);
  const started = useRef(false);

  const tryStart = useCallback(() => {
    if (player.current && surfaceReady.current && metaReady.current && !started.current) {
      started.current = true;
      player.current.play();
    }
  }, []);

  useEffect(() => {
    const p = new VideoPlayer();
    player.current = p;
    p.initialize()
      .then(() => {
        p.src = src;
        p.addEventListener('loadedmetadata', () => {
          metaReady.current = true;
          tryStart();
        });
        p.addEventListener('error', () => console.log('[moment] player error', JSON.stringify(p.error)));
      })
      .catch((e: unknown) => console.log('[moment] player init failed', String(e)));
    // Switching clips remounts the player screen: stop and release the old player.
    return () => {
      try {
        p.pause();
        p.deinitialize().catch(() => undefined);
      } catch (e) {
        console.log('[moment] player cleanup failed', String(e));
      }
      player.current = null;
    };
  }, [src, tryStart]);

  const onSurfaceViewCreated = useCallback(
    (handle: string) => {
      player.current?.setSurfaceHandle(handle);
      surfaceReady.current = true;
      tryStart();
    },
    [tryStart],
  );

  const onSurfaceViewDestroyed = useCallback(() => {
    surfaceReady.current = false;
    // The docs pass null here; the typings only accept string.
    player.current?.clearSurfaceHandle(null as unknown as string);
  }, []);

  // Seek by setting currentTime; resolve when the player reports 'seeked' (or after 1.5 s, whichever is first).
  const seek = useCallback((t: number): Promise<void> => {
    const p = player.current;
    if (!p) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          p.removeEventListener('seeked', finish);
          resolve();
        }
      };
      p.addEventListener('seeked', finish);
      setTimeout(finish, 1500);
      p.currentTime = t;
    });
  }, []);

  return {
    seek,
    currentTime: () => player.current?.currentTime ?? 0,
    pause: () => player.current?.pause(),
    play: () => player.current?.play(),
    onSurfaceViewCreated,
    onSurfaceViewDestroyed,
  };
};
