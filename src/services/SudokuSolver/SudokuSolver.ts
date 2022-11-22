import SudokuSolverInterface, {
  PossibleDigitsMatrix,
  Sudoku,
} from '../../types/interfaces/SudokuSolver';

const EMPTY = 0;

export default class SudokuSolver implements SudokuSolverInterface {
  protected grid: Sudoku;
  protected possibleDigits: PossibleDigitsMatrix;
  protected width: number;
  protected height: number;
  protected blockWidth: number;
  protected blockHeight: number;

  constructor(grid: Sudoku) {
    this.grid = grid;
    this.width = grid[0].length;
    this.height = grid.length;
    this.blockWidth = Math.sqrt(this.width);
    this.blockHeight = Math.sqrt(this.height);
    // TODO: See if using bitmasks is much faster than using sets... 🧐
    this.possibleDigits = this.buildPossibleDigitsMatrix();

    this.eliminateImpossibleDigits();
    this.autofillInferredValues();
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
    for (let blockRow = 0; blockRow < height / blockHeight; blockRow++)
      for (let blockCol = 0; blockCol < width / blockWidth; blockCol++)
        if (!this.validateBlock(blockRow, blockCol)) return false;

    return true;
  }

  /**
   * Helper function for isValid() - this shouldn't be used to validate a specific cell's block,
   * as there's no need to build a Set in that case (given that you only need to search for one
   * digit).
   */
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

  /**
   * Returns true, if the specified digit exists elsewhere in its block.
   * (This is a pretty big "cycle-saver", as it will sit in the innermost loop of the solve()
   * method.)
   */
  protected scanCellsBlock(digit: number, digitRow: number, digitCol: number): boolean {
    const blockRow = Math.floor(digitRow / this.blockHeight);
    const blockCol = Math.floor(digitCol / this.blockWidth);
    const heightRatio = this.height / this.blockHeight;
    const widthRatio = this.width / this.blockWidth;

    for (let r = 0; r < this.blockHeight; r++) {
      const row = blockRow * heightRatio + r;
      for (let c = 0; c < this.blockWidth; c++) {
        const col = blockCol * widthRatio + c;
        if (row !== digitRow && col !== digitCol && this.grid[row][col] === digit) return false;
      }
    }

    return true;
  }

  protected validateCell(row: number, col: number): boolean {
    const { grid, height } = this;
    const digit = grid[row][col];

    for (let i = 0; i < height; i++) {
      if (i !== col && grid[row][i] === digit) return false;
      if (i !== row && grid[i][col] === digit) return false;
    }

    return this.scanCellsBlock(digit, row, col);
  }

  protected buildPossibleDigitsMatrix(): PossibleDigitsMatrix {
    return Array.from({ length: this.height }, (row, rowIndex) =>
      Array.from({ length: this.width }, (cell, cellIndex) => {
        const possibleDigits = this.grid[rowIndex][cellIndex]
          ? [this.grid[rowIndex][cellIndex]]
          : [1, 2, 3, 4, 5, 6, 7, 8, 9];
        return new Set(possibleDigits);
      })
    );
  }

  protected eliminateFromRow(digit: number, row: number, digitCell: number): void {
    for (let col = 0; col < this.width; col++)
      // Skip the cell we're using as a reference point.
      if (col !== digitCell) this.possibleDigits[row][col].delete(digit);
  }

  protected eliminateFromColumn(digit: number, col: number, digitRow: number): void {
    for (let row = 0; row < this.height; row++)
      // Skip the cell we're using as a reference point.
      if (row !== digitRow) this.possibleDigits[row][col].delete(digit);
  }

  protected eliminateFromBlock(digit: number, digitRow: number, digitCol: number): void {
    const blockRow = Math.floor(digitRow / this.blockHeight);
    const blockCol = Math.floor(digitCol / this.blockWidth);
    const heightRatio = this.height / this.blockHeight;
    const widthRatio = this.width / this.blockWidth;

    for (let r = 0; r < this.blockHeight; r++) {
      const row = blockRow * heightRatio + r;
      for (let c = 0; c < this.blockWidth; c++) {
        const col = blockCol * widthRatio + c;
        if (row !== digitRow && col !== digitCol) this.possibleDigits[row][col].delete(digit);
      }
    }
  }

  protected eliminateImpossibleDigits(): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const digit = this.grid[row][col];

        this.eliminateFromRow(digit, row, col);
        this.eliminateFromColumn(digit, col, row);
        this.eliminateFromBlock(digit, row, col);
      }
    }
  }

  /**
   * Autofill the grid, using possibleDigitsMatrix values (where the corresponding set has only one
   * value).
   */
  protected autofillInferredValues(): void {
    for (let row = 0; row < this.height; row++)
      for (let col = 0; col < this.width; col++)
        if (this.possibleDigits[row][col].size === 1) {
          const [onlyPossibleValue] = Array.from(this.possibleDigits[row][col].values());
          this.grid[row][col] = onlyPossibleValue;
        }
  }

  public solve(lastRow = 0, lastCol = 0): Sudoku | null {
    const { grid, width, height } = this;
    let firstCol = true;

    for (let row = lastRow; row < height; row++) {
      for (let col = firstCol ? lastCol : 0; col < width; col++) {
        if (grid[row][col] === EMPTY) {
          // If the cell is empty, try filling it with each possible number
          for (const n of Array.from(this.possibleDigits[row][col])) {
            grid[row][col] = n;

            // If this number is valid in the cell, continue exploring this "path" with a DFS and
            // return the grid if it solves.
            if (this.validateCell(row, col) && this.solve(row, col + 1)) return grid;
          }

          // If we couldn't find a valid number for the cell, then we need to stop exploring this
          // path and backtrack; by resetting the cell to "empty".
          grid[row][col] = EMPTY;
          return null;
        }
      }

      firstCol = false;
    }

    return grid;
  }
}
