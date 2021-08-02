import SudokuSolverInterface, { Sudoku } from '../../types/interfaces/SudokuSolver';

export default class SudokuSolver implements SudokuSolverInterface {
  protected grid: Sudoku;

  constructor(grid: Sudoku) {
    this.grid = grid;
  }

  public isValid(): boolean {
    return !!this.grid;
  }

  public solve(): Sudoku {
    return this.grid;
  }
}
