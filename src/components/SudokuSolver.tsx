import structuredClone from '@ungap/structured-clone';

import { SudokuSolver as SudokuSolverService } from '../services';
import { Sudoku } from '../types/interfaces/SudokuSolver';
import styles from './SudokuSolver.module.scss';

export default function SudokuSolver({ sudoku }: { sudoku: Sudoku }) {
  // If we don't clone it, the original sudoku is modified and a wierd occurs, where all the table
  // cells are rendered as original!
  const sudokuSolver = new SudokuSolverService(structuredClone(sudoku));
  const solved = sudokuSolver.isValid() ? sudokuSolver.solve() : null;

  let key = 0;
  return (
    <table className={styles.sudokuSolver}>
      <tbody>
        {solved ? (
          solved.map((row, r) => (
            <tr key={key}>
              {row.map((cell, c) => (
                // eslint-disable-next-line no-plusplus -- 🙄
                <td key={key++} className={sudoku[r][c] ? styles.original : ''}>
                  {cell}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <div className={styles.error}>
            <div>
              <h2>Scan Failed</h2>
              <p>Please try to ensure the image is clear and not obstructed by anything.</p>
              <p>(PS: webcams or partially-completed sudokus likely won&apos;t work!)</p>
            </div>
          </div>
        )}
      </tbody>
    </table>
  );
}
