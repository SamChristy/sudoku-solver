import SudokuSolverInterface, { Sudoku } from '../../types/interfaces/SudokuSolver';

export default class SudokuSolver implements SudokuSolverInterface {
  protected grid: Sudoku;
  protected size = 9;
  protected subGridSize = 3;
  protected subGridRatio = this.size / this.subGridSize;

  constructor(grid: Sudoku) {
    this.grid = grid;
  }

  protected validateRows(): boolean {
    for (let r = 0; r < this.size; r++) {
      const encountered = new Set();

      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c]) {
          if (encountered.has(this.grid[r][c])) return false;
          encountered.add(this.grid[r][c]);
        }
      }
    }

    return true;
  }

  protected validateColumns(): boolean {
    for (let c = 0; c < this.size; c++) {
      const encountered = new Set();

      for (let r = 0; r < this.size; r++) {
        if (!this.grid[r][c]) {
          if (encountered.has(this.grid[r][c])) return false;
          encountered.add(this.grid[r][c]);
        }
      }
    }

    return true;
  }

  protected validateSubGrid(x: number, y: number): boolean {
    const yStart = y * this.subGridRatio;
    const xStart = x * this.subGridRatio;
    const encountered = new Set();

    for (let c = yStart; c < yStart + this.subGridSize; c++) {
      for (let r = xStart; r < xStart + this.subGridSize; r++) {
        if (!this.grid[r][c]) {
          if (encountered.has(this.grid[r][c])) return false;
          encountered.add(this.grid[r][c]);
        }
      }
    }

    return true;
  }

  protected validateSubGrids(): boolean {
    for (let c = 0; c < this.subGridSize; c++) {
      for (let r = 0; r < this.subGridSize; r++) {
        if (!this.validateSubGrid(c, r)) return false;
      }
    }

    return true;
  }

  public isValid(): boolean {
    return this.validateRows() && this.validateColumns() && this.validateSubGrids();
  }

  public solve(): Sudoku {
    return this.grid;
  }
}
