import './App.scss';

import { useEffect, useState } from 'react';

import SudokuSolver from './components';
import { SudokuScanner } from './services';

export default function App() {
  const [loading, setLoading] = useState(true);

  // TODO: Add Error handling & browser feature checks

  useEffect(() => {
    (async () => {
      await SudokuScanner.loadDependencies();
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <button
        style={{ position: 'fixed', top: '10px', left: '10px' }}
        onClick={() => setLoading(!loading)}
        type="button"
      >
        {loading ? 'mount' : 'unmout'}
      </button>
      {loading ? <i>Loading...</i> : <SudokuSolver />}
    </>
  );
}
