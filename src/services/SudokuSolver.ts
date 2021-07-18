type SudokuGrid = number[][];

export default class SudokuSolver {
  protected grid: SudokuGrid;

  constructor(grid: SudokuGrid) {
    this.grid = grid;
  }

  public isValid(): boolean {
    return !!this.grid;
  }

  public solve(): SudokuGrid {
    return this.grid;
  }
}
