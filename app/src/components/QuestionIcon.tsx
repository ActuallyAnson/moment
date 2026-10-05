import React from 'react';
import {Circle, Path, Svg} from '@amazon-devices/react-native-svg';
import {QUESTIONS} from '../questions';

// Simple filled glyphs on a 24x24 grid, one per preset question (decorative; the label carries the meaning).
export const QuestionIcon = ({question, color, size}: {question: string; color: string; size: number}) => {
  const idx = QUESTIONS.findIndex((q) => q === question);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {idx === 0 && <Path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" fill={color} />}
      {idx === 1 && (
        <>
          <Circle cx="12" cy="8" r="4" fill={color} />
          <Path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21 Z" fill={color} />
        </>
      )}
      {idx === 2 && <Path d="M4 5 H20 V8.5 H13.8 V20 H10.2 V8.5 H4 Z" fill={color} />}
      {idx === 3 && <Path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill={color} />}
    </Svg>
  );
};
