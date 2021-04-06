import './App.scss';

import { OpenCvProvider } from 'opencv-react';
import { useState } from 'react';

import SudokuSolver from './components';

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <OpenCvProvider
      onLoad={() => setLoading(false)}
      openCvPath={`${process.env.PUBLIC_URL}/opencv.js`}
    >
      {loading ? <i>Loading...</i> : <SudokuSolver />}
    </OpenCvProvider>
  );
}
