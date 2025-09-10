// File: app/page.tsx
"use client";

import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ShieldCheck, Zap, Users, RefreshCw, XCircle, Loader2 } from 'lucide-react';

// --- Type definition for the API response ---
interface AnalysisResult {
  prediction: "spoof" | "bonafide";
  probabilities: {
    bonafide: number;
    spoof: number;
  };
  spectrogram_png: string;
}

// --- Main component for the application ---
export default function VoiceGuardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setError(null); // Clear previous errors
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'] },
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // IMPORTANT: Replace with your actual backend URL
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  // --- Render different views based on the state ---
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <Header />

        {error && <ErrorMessage message={error} />}

        {!result && (
          <div className="mt-8">
            <UploadZone
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              file={file}
            />
            <AnalyzeButton
              handleAnalyze={handleAnalyze}
              isLoading={isLoading}
              file={file}
            />
          </div>
        )}

        {result && <ResultDisplay result={result} onReset={handleReset} />}
      </div>
    </main>
  );
}

// --- Sub-components for better structure ---

const Header = () => (
  <header className="text-center">
    <h1 className="text-4xl sm:text-5xl font-bold text-white">VoiceGuard</h1>
    <p className="mt-2 text-lg text-slate-400">
      Synthetic Voice & Deepfake Audio Detection
    </p>
  </header>
);

const UploadZone = ({ getRootProps, getInputProps, isDragActive, file }: any) => (
  <div
    {...getRootProps()}
    className={`p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300
    ${isDragActive ? 'border-blue-400 bg-blue-900/20' : 'border-slate-700 hover:border-blue-500'}
    ${file ? 'border-green-500' : ''}`}
  >
    <input {...getInputProps()} />
    <div className="flex flex-col items-center text-center">
      <UploadCloud className={`w-16 h-16 mb-4 ${file ? 'text-green-500' : 'text-slate-500'}`} />
      {file ? (
        <>
          <p className="font-semibold text-white">{file.name}</p>
          <p className="text-sm text-slate-400">Ready for Analysis</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-white">
            {isDragActive ? 'Drop the file here' : 'Click to select audio file or drag and drop'}
          </p>
          <p className="text-sm text-slate-400">Supported formats: MP3, WAV, M4A, OGG</p>
        </>
      )}
    </div>
  </div>
);

const AnalyzeButton = ({ handleAnalyze, isLoading, file }: any) => (
  <div className="mt-6 flex justify-center">
    <button
      onClick={handleAnalyze}
      disabled={!file || isLoading}
      className="w-full sm:w-1/2 flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg
      hover:bg-blue-700 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin mr-2" />
          Analyzing...
        </>
      ) : (
        'Start Analysis'
      )}
    </button>
  </div>
);

const ResultDisplay = ({ result, onReset }: { result: AnalysisResult; onReset: () => void }) => {
  const isSpoof = result.prediction === 'spoof';
  const confidence = (result.probabilities[result.prediction] * 100).toFixed(2);

  const resultColor = isSpoof ? 'text-red-500' : 'text-green-500';
  const resultBgColor = isSpoof ? 'bg-red-900/20 border-red-800' : 'bg-green-900/20 border-green-800';

  return (
    <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-white">Analysis Complete</h2>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Left Side: Prediction & Details */}
        <div className={`p-6 rounded-lg border ${resultBgColor}`}>
          <h3 className="text-lg font-semibold text-slate-300">Detection Result</h3>
          <p className={`text-5xl font-bold my-4 capitalize ${resultColor}`}>{result.prediction}</p>
          <div className="space-y-2 text-slate-300">
            <p>
              <span className="font-semibold">Confidence: </span> 
              <span className={`font-bold ${resultColor}`}>{confidence}%</span>
            </p>
            <p>
              <span className="font-semibold">Spoof Probability: </span> 
              {(result.probabilities.spoof * 100).toFixed(2)}%
            </p>
            <p>
              <span className="font-semibold">Bonafide Probability: </span> 
              {(result.probabilities.bonafide * 100).toFixed(2)}%
            </p>
          </div>
        </div>
        
        {/* Right Side: Spectrogram */}
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Log-Mel Spectrogram</h3>
          <div className="bg-black rounded-md overflow-hidden">
            <img src={result.spectrogram_png} alt="Spectrogram of the audio" className="w-full h-auto" />
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <button
          onClick={onReset}
          className="flex items-center justify-center bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg
          hover:bg-slate-700 transition-all duration-300"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Analyze Another File
        </button>
      </div>
    </div>
  );
};



const ErrorMessage = ({ message }: { message: string }) => (
  <div className="mt-4 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg flex items-center justify-center">
    <XCircle className="w-5 h-5 mr-2" />
    <p>{message}</p>
  </div>
);