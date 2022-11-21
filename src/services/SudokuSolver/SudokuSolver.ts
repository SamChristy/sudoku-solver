import SudokuSolverInterface, { Sudoku } from '../../types/interfaces/SudokuSolver';

export default class SudokuSolver implements SudokuSolverInterface {
  protected grid: Sudoku;
  protected width: number;
  protected height: number;
  protected blockWidth: number;
  protected blockHeight: number;

  constructor(grid: Sudoku) {
    this.grid = grid;
    this.width = 9;
    this.height = 9;
    this.blockWidth = 3;
    this.blockHeight = 3;
  }

  public isValid(): boolean {
    const { grid, width, height, blockWidth, blockHeight } = this;

    // Check rows
    for (let row = 0; row < height; row++) {
      const rowSet = new Set();

      for (let col = 0; col < width; col++) {
        const digit = grid[row][col];

        if (digit) {
          if (rowSet.has(digit)) return false;
          rowSet.add(digit);
        }
      }
    }

    // Check columns
    for (let col = 0; col < width; col++) {
      const columnSet = new Set();

      for (let row = 0; row < height; row++) {
        const digit = grid[row][col];

        if (digit) {
          if (columnSet.has(digit)) return false;
          columnSet.add(digit);
        }
      }
    }

    // Check blocks
    for (let blockRow = 0; blockRow < height / blockHeight; blockRow++) {
      for (let blockCol = 0; blockCol < width / blockWidth; blockCol++) {
        if (!this.validateBlock(blockRow, blockCol)) return false;
      }
    }

    return true;
  }

  protected validateBlock(blockRow: number, blockCol: number): boolean {
    const { grid, blockWidth, blockHeight } = this;

    const rowOffset = blockRow * blockHeight;
    const colOffset = blockCol * blockWidth;
    const blockSet = new Set();

    for (let row = rowOffset; row < rowOffset + blockHeight; row++) {
      for (let col = colOffset; col < colOffset + blockWidth; col++) {
        const digit = grid[row][col];

        if (digit) {
          if (blockSet.has(digit)) return false;
          blockSet.add(digit);
        }
      }
    }

    return true;
  }

  protected validateCell(row: number, col: number): boolean {
    const { grid, height, blockWidth, blockHeight } = this;
    const digit = grid[row][col];

    for (let i = 0; i < height; i++) {
      if (i !== col && grid[row][i] === digit) return false;
      if (i !== row && grid[i][col] === digit) return false;
    }

    // Validate block
    return this.validateBlock(Math.floor(row / blockHeight), Math.floor(col / blockWidth));
  }

  // TODO: Improve sudoku-solving algo, by eliminating invalid numbers to begin with
  //       (using bitmasks, to represent possible numbers, might also be faster?)
  public solve(): Sudoku | null {
    const { grid, width, height } = this;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (!grid[row][col]) {
          // If the cell is empty, try filling it with each possible number
          for (let n = 1; n <= 9; n++) {
            grid[row][col] = n;

            // If this number is valid in the cell, continue exploring this "path" with a DFS and
            // return the grid if it solves.
            if (this.validateCell(row, col) && this.solve()) return grid;
          }

          // If we couldn't find a valid number for the cell, then we need to stop exploring this
          // path and backtrack; by resetting the cell to "empty".
          grid[row][col] = 0;
          return null;
        }
      }
    }

    return grid;
  }
}
