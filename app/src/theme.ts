// Colour tokens. Contrast ratios are locked by app/test/contrast.test.ts (WCAG AA: 4.5:1 text, 3:1 focus).
export const colors = {
  scrim: '#171819', // worst case: a white video frame behind the card background
  card: 'rgba(14,16,24,0.94)',
  cardBorder: 'rgba(255,255,255,0.10)',
  dim: 'rgba(0,0,0,0.45)',
  textPrimary: '#ffffff',
  textSecondary: '#c8ccd6',
  accent: '#ffb020',
  buttonBg: '#2b2f3a',
  onAccent: '#101010',
  focusBorder: '#ffffff',
};

// Gradient stops (react-linear-gradient). Cards fade from a lighter slate to near-black; focus is amber to orange.
export const gradients = {
  card: ['rgba(30,34,52,0.96)', 'rgba(10,12,20,0.97)'],
  focus: ['#ffc247', '#ff9a1f'],
  scrimBottom: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.78)'],
  scrimRight: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.80)'],
};
