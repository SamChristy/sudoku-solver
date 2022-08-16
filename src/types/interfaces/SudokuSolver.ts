export type Sudoku = number[][];

export default interface SudokuSolver {
  /**
   * Returns true if the Sudoku has no digits in incorrect places. False, otherwise.
   */
  isValid(): boolean;

  /**
   * Returns the solved sudoku! 🎱
   */
  solve(): Sudoku | null;
}
