import React from 'react';
import {Circle, Path, Svg} from '@amazon-devices/react-native-svg';

// Simple filled glyphs on a 24x24 grid, one per preset question, chosen by the question text (decorative; the label carries the meaning).
export const QuestionIcon = ({question, color, size}: {question: string; color: string; size: number}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {question === 'What just happened?' && <Path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={color} />}
      {question === 'What did they just say?' && (
        // speech bubble outline with two caption lines (drawn with strokes so no fill rule is needed)
        <>
          <Path d="M4 3 H20 A2 2 0 0 1 22 5 V15 A2 2 0 0 1 20 17 H10 L5 21.5 V17 H4 A2 2 0 0 1 2 15 V5 A2 2 0 0 1 4 3 Z" fill={color} />
          <Path d="M6 7.5 H18 V9.5 H6 Z M6 11 H14 V13 H6 Z" fill="#101010" fillOpacity={0.85} />
        </>
      )}
      {question === 'Who is on screen?' && (
        <>
          <Circle cx="12" cy="8" r="4" fill={color} />
          <Path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21 Z" fill={color} />
        </>
      )}
      {question === 'What does the text say?' && <Path d="M4 5 H20 V8.5 H13.8 V20 H10.2 V8.5 H4 Z" fill={color} />}
      {question === 'What should I notice here?' && <Path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill={color} />}
    </Svg>
  );
};
