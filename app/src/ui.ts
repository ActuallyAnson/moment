import {createContext, useContext} from 'react';
import {Dimensions} from 'react-native';

// Vega lays out on a 960x540 dp canvas (scale 2), measured on the Vega Virtual Device.
// All sizes are written for a 1920x1080 reference and scaled here.
const k = Dimensions.get('window').width / 1920;
export const px = (n: number): number => n * k;

// User text size (1 = normal). Fonts scale with it; layout does not.
export const TextScaleContext = createContext(1);
export const useFont = (): ((n: number) => number) => {
  const scale = useContext(TextScaleContext);
  return (n: number) => px(n * scale);
};

// Safe area: keep text and focus targets out of the outer 5% (96 px sides, 54 px top/bottom at 1080p).
export const SAFE_X = 96;
export const SAFE_Y = 54;
