import './App.scss';

import { OpenCvProvider } from 'opencv-react';
import { useState } from 'react';

import SudokuSolver from './components';

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <button
        style={{ position: 'fixed', top: '10px', left: '10px' }}
        onClick={() => setLoading(!loading)}
        type="button"
      >
        {loading ? 'mount' : 'unmout'}
      </button>
      <OpenCvProvider
        onLoad={() => setLoading(false)}
        openCvPath={`${process.env.PUBLIC_URL}/opencv.js`}
      >
        {loading ? <i>Loading...</i> : <SudokuSolver />}
      </OpenCvProvider>
    </>
  );
}
