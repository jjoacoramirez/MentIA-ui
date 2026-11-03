import React from "react";
import type { ExerciseType } from "../services/api";
import type { GameProps } from "./common";
import { GridGame } from "./GridGame";
import { NBackGame } from "./NBackGame";
import { OddOneOutGame } from "./OddOneOutGame";
import { RecognitionGame } from "./RecognitionGame";
import { SequenceGame } from "./SequenceGame";
import { StroopGame } from "./StroopGame";

/** Un componente por mecánica (`exerciseType` del backend). */
const games: Record<ExerciseType, React.FC<GameProps>> = {
  VISUAL_RECOGNITION: RecognitionGame,
  SPATIAL_GRID: GridGame,
  ODD_ONE_OUT: OddOneOutGame,
  STROOP: StroopGame,
  REVERSE_SEQUENCE: SequenceGame,
  N_BACK: NBackGame,
  AUDITORY_SEQUENCE: SequenceGame,
};

export const exerciseNames: Record<ExerciseType, string> = {
  VISUAL_RECOGNITION: "Reconocimiento visual",
  SPATIAL_GRID: "Cuadrícula",
  ODD_ONE_OUT: "Elemento diferente",
  STROOP: "Color y palabra",
  REVERSE_SEQUENCE: "Secuencia inversa",
  N_BACK: "N-back",
  AUDITORY_SEQUENCE: "Secuencia de sonidos",
};

export function Game(props: GameProps) {
  const Component = games[props.item.exerciseType] ?? SequenceGame;
  return <Component {...props} />;
}

export type { GameOutcome, GameProps } from "./common";
