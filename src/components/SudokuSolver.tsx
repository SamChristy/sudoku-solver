import { useOpenCv } from 'opencv-react';

export default function SudokuSolver() {
  const { cv } = useOpenCv();
  console.log('Loaded 👍', cv);

  return <h1>🧮 Sudoku Solver</h1>;
}
