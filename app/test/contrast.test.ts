import {contrastRatio} from '../src/contrast';
import {colors} from '../src/theme';

describe('contrast (WCAG AA)', () => {
  const textPairs: [string, string, string][] = [
    ['primary text on scrim', colors.textPrimary, colors.scrim],
    ['secondary text on scrim', colors.textSecondary, colors.scrim],
    ['accent text on scrim', colors.accent, colors.scrim],
    ['label on button', colors.textPrimary, colors.buttonBg],
    ['label on focused (accent) button', colors.onAccent, colors.accent],
  ];
  test.each(textPairs)('%s is at least 4.5:1', (_n, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  test('focus indicators are at least 3:1 against what they sit on', () => {
    expect(contrastRatio(colors.focusBorder, colors.scrim)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors.accent, colors.buttonBg)).toBeGreaterThanOrEqual(3);
  });

  test('known values', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});
