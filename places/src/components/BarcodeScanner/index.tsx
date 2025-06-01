'use client';

import { Button, LiveFeedback, Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera } from 'iconoir-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScanResult?: (result: string) => void;
  onClose?: () => void;
  autoStart?: boolean; // Auto-start scanning immediately
  continuousScanning?: boolean; // Continue scanning after finding results
  className?: string;
}

export const BarcodeScanner = ({ 
  onScanResult, 
  onClose, 
  autoStart = false, 
  continuousScanning = true,
  className
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(autoStart); // Initial state based on autoStart
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Effect for codeReader initialization, main cleanup, and auto-start
  useEffect(() => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }
    const currentReader = codeReaderRef.current; // For cleanup closure

    if (autoStart && !isScanning) { // If autoStart is true and not already scanning
      setError(null);
      setScanResult(null);
      // setHasPermission(null); // Let permission be checked naturally by startScanning
      setIsScanning(true); // Trigger the scanning effect
    }

    return () => {
      currentReader?.reset();
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    };
  }, [autoStart, isScanning]); // isScanning in deps for the autoStart conditional logic

  // Effect for video element specific event listeners
  useEffect(() => {
    const currentVideoElement = videoRef.current;
    if (!currentVideoElement) return;

    const handleVideoEnded = () => {
      console.log('Video stream ended');
      setIsScanning(false);
      setError(null); 
    };

    const handleVideoError = (event: Event) => {
      console.log('Video error occurred:', event);
      if (isScanning) { // Only set error if we were actively trying to scan
        setError('Camera connection lost. Please try again.');
      }
      setIsScanning(false);
    };

    currentVideoElement.addEventListener('ended', handleVideoEnded);
    currentVideoElement.addEventListener('error', handleVideoError);

    return () => {
      currentVideoElement.removeEventListener('ended', handleVideoEnded);
      currentVideoElement.removeEventListener('error', handleVideoError);
    };
  }, [isScanning]); // Depends on isScanning for the conditional error logic

  const requestCameraPermission = useCallback(async () => {
    // ... (requestCameraPermission implementation remains largely the same)
    // Ensure it sets hasPermission state correctly and returns a boolean
    try {
      setError(null);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      }
      stream.getTracks().forEach(track => track.stop()); 
      setHasPermission(true);
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError': setError('Camera permission denied. Please enable camera access in your browser settings.'); break;
          case 'NotFoundError': setError('No camera found on this device.'); break;
          case 'NotSupportedError': setError('Camera access is not supported in this browser.'); break;
          default: setError('Failed to access camera. Please check your permissions.');
        }
      } else {
        setError('Failed to request camera permission');
      }
      return false;
    }
  }, []); // No dependencies, so it's stable

  const startScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current) {
      console.warn("startScanning: codeReader or videoRef not ready.");
      setIsScanning(false); // Ensure we exit scanning state if prerequisites are not met
      return;
    }
    const reader = codeReaderRef.current;

    // Permission check is now more critical here as this is the main scanning function
    if (hasPermission === null) {
      const permissionGranted = await requestCameraPermission();
      if (!permissionGranted) {
        setIsScanning(false);
        return; // Stop if permission was not granted
      }
      // After permission request, hasPermission state will update,
      // the main scanning useEffect will re-evaluate.
      // To avoid re-triggering, we can check hasPermission again.
      // However, the effect structure should handle this. For now, let's proceed.
    } else if (hasPermission === false) {
      setError('Camera permission is required to scan.');
      setIsScanning(false);
      return;
    }
    
    // Clear previous errors when starting a scan attempt
    setError(null);

    try {
      const videoInputDevices = await reader.listVideoInputDevices();
      if (videoInputDevices.length === 0) throw new Error('No camera devices found');
      
      let selectedDeviceId = videoInputDevices[0].deviceId;
      const backCamera = videoInputDevices.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || label.includes('environment') || label.includes('rear');
      });
      if (backCamera) selectedDeviceId = backCamera.deviceId;

      const result = await reader.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current);
      
      if (result) {
        // Stop camera resources immediately
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        // reader.reset(); // Resetting here might be too soon if continuous scanning reuses it.

        setScanResult(result.getText());
        onScanResult?.(result.getText());
        
        if (continuousScanning) {
          setTimeout(() => {
            setScanResult(null); 
            if (isScanning) { // Check if still in scanning mode
              startScanning(); // Re-initiate scan for continuous mode
            } else {
              reader.reset(); // If scanning was stopped during timeout
            }
          }, 1500);
        } else {
          setIsScanning(false); // Stop scanning if not continuous
          reader.reset();
        }
      }
    } catch (err) {
      console.error('Scanning error:', err);
      if (err instanceof NotFoundException) {
        console.log('No barcode detected, continuing scan if continuous...');
        if (isScanning && continuousScanning) { // If continuous, try again
            setTimeout(() => startScanning(), 100); // Brief delay before retrying
        } else if (!continuousScanning) {
            setError('No barcode found.');
            setIsScanning(false);
            reader.reset();
        }
        // If not continuous and no barcode, it will fall through to generic error handling if not caught
      } else if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (errorMessage.includes('video stream has ended') || errorMessage.includes('stream ended')) {
          console.log('Video stream ended, stopping scan silently');
        } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
          setError('Camera permission denied. Please enable camera access.');
        } else if (errorMessage.includes('no camera') || errorMessage.includes('not found')) {
          setError('No camera found on this device.');
        } else {
          setError('Unable to access camera. Please try again.');
        }
      } else {
        console.log('Unknown scanning error, stopping silently');
      }
      if (!(err instanceof NotFoundException && continuousScanning && isScanning)) {
        setIsScanning(false); // Stop scanning on other errors or if not continuing
        reader.reset();
      }
    }
  }, [hasPermission, onScanResult, continuousScanning, requestCameraPermission, isScanning]); // isScanning for continuous logic

  // Effect to START or STOP scanning based on isScanning state
  useEffect(() => {
    if (isScanning && codeReaderRef.current && !scanResult) { // Only start if not already showing a result
      startScanning();
    } else if (!isScanning && codeReaderRef.current) {
      // Cleanup when isScanning becomes false explicitly (e.g., by stopScanning button or error)
      codeReaderRef.current.reset();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isScanning, startScanning, scanResult]); // scanResult to re-trigger if cleared for continuous scan


  const handleStartButtonClick = () => {
    setError(null);
    setScanResult(null);
    setHasPermission(null); // Reset permission to allow re-check by startScanning
    setIsScanning(true); // This will trigger the useEffect above
  };

  const stopScanning = () => {
    // User explicitly stops scanning
    setIsScanning(false); // This will trigger cleanup in the useEffect above
    // codeReaderRef.current?.reset(); // Redundant due to effect
    // stream stop redundant due to effect
    setError(null); // Clear any errors
    if (onClose) {
      onClose();
    }
  };

  const retryScanning = () => {
    setScanResult(null); // Clear previous result
    setError(null);       // Clear previous error
    // setHasPermission(null); // Optionally reset permission
    if (!isScanning) {    // If not already scanning (e.g., after an error or non-continuous scan)
      setIsScanning(true); // Re-initiate scanning
    } else {
      // If already scanning (e.g. continuous scan failed with NotFound), startScanning might be called again by itself
      // or we can force it if needed, but current continuous logic should handle retries on NotFound.
      // For a manual "scan another" button after a successful scan, this will set isScanning true.
    }
  };

  return (
    <div className={`relative w-full max-w-md mx-auto p-4 bg-gray-900 rounded-lg shadow-xl ${className}`}>
      {/* Camera View or Placeholder */}
      {isScanning && (
        <div className="relative w-full max-w-md aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {/* Scanning animation overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>
        </div>
      )}

      {/* Controls: Button, Result, Error messages */}
      <div className="w-full max-w-md space-y-4">
        {!isScanning && !scanResult && (
          <LiveFeedback
            state={hasPermission === false ? 'failed' : undefined}
            className="w-full"
          >
            <Button
              onClick={handleStartButtonClick} // Changed to handleStartButtonClick
              disabled={hasPermission === false}
              variant="primary"
              size="lg"
              className="w-full flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Start Scanning
            </Button>
          </LiveFeedback>
        )}

        {scanResult && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <Typography variant="heading" level={3} className="text-green-800 mb-2">Scan Result:</Typography>
              <Typography className="text-green-700 break-all">{scanResult}</Typography>
            </div>
            <Button
              onClick={retryScanning}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Scan Another
            </Button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <Typography className="text-red-700">{error}</Typography>
            {hasPermission === false && (
              <Button
                onClick={requestCameraPermission}
                variant="secondary"
                size="sm"
                className="mt-2"
              >
                Request Permission Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
