import { useCallback, useState } from 'react';
import { CameraView } from './components/CameraView';
import { Hud, type CategoryCounts } from './components/Hud';
import './App.css';

export function App() {
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<CategoryCounts>({
    walkedBy: 0,
    looked: 0,
    talked: 0,
  });

  const handleStart = useCallback(() => {
    setError(null);
    setStarted(true);
  }, []);

  const handleCameraError = useCallback((message: string) => {
    setError(message);
    setStarted(false);
  }, []);

  return (
    <div className="app">
      {started ? (
        <>
          <CameraView onError={handleCameraError} onCountsChange={setCounts} />
          <Hud counts={counts} />
        </>
      ) : (
        <div className="start-screen">
          <h1>Booth Analytics</h1>
          <p>Webcam-driven engagement counter for sponsored booths.</p>
          <button className="start-button" onClick={handleStart}>
            Start camera
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}
