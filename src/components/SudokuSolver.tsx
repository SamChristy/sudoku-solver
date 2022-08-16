import { Sudoku } from '../types/interfaces/SudokuSolver';
import styles from './SudokuSolver.module.scss';

export default function SudokuSolver({ sudoku }: { sudoku: Sudoku }) {
  let i = 0;
  return (
    <table className={styles.sudokuSolver}>
      <tbody>
        {sudoku.map(row => (
          <tr key={i}>
            {row.map(cell => (
              // eslint-disable-next-line no-plusplus -- 🙄
              <td key={i++}>{cell || ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
