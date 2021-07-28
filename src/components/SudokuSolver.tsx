export default function SudokuSolver() {
  return (
    <table>
      <tbody>
        {Array(9)
          .fill(1)
          .map(() => (
            <tr>
              {Array(9)
                .fill(1)
                .map(() => (
                  <td>{Math.floor(Math.random() * 10) || ''}</td>
                ))}
            </tr>
          ))}
      </tbody>
    </table>
  );
}
