'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';

interface BarcodeScannerProps {
  onScan?: (result: string, format: string) => void;
  onError?: (error: string) => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  isActive?: boolean;
  width?: number;
  height?: number;
}

interface ScanResult {
  text: string;
  format: string;
  timestamp: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  onPermissionGranted,
  onPermissionDenied,
  isActive = false,
  width = 300,
  height = 200,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize ZXing reader
  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  // Request camera permissions and start/stop scanning based on isActive prop
  useEffect(() => {
    if (isActive) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isActive]);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      onPermissionGranted?.();
      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMessage);
      setHasPermission(false);
      onPermissionDenied?.();
      onError?.(errorMessage);
      return false;
    }
  };

  const startScanning = async () => {
    if (isScanning || !videoRef.current || !readerRef.current) return;

    try {
      // Request camera permission if not already granted
      if (!streamRef.current) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) return;
      }

      // Attach stream to video element
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play();
      }

      setIsScanning(true);

      // Start scanning interval
      scanIntervalRef.current = setInterval(async () => {
        await scanFrame();
      }, 100); // Scan every 100ms

    } catch (err) {
      console.error('Error starting scanner:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start scanner';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopScanning = useCallback(() => {
    setIsScanning(false);

    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setHasPermission(null);
  }, []);

  const scanFrame = async () => {
    if (!videoRef.current || !readerRef.current || !isScanning) return;

    try {
      const result: Result = await readerRef.current.decodeFromVideoElement(videoRef.current);
      if (result) {
        const scanResult: ScanResult = {
          text: result.getText(),
          format: result.getBarcodeFormat().toString(),
          timestamp: Date.now()
        };

        // Avoid duplicate scans within 2 seconds
        if (
          !lastScanResult ||
          lastScanResult.text !== scanResult.text ||
          Date.now() - lastScanResult.timestamp > 2000
        ) {
          setLastScanResult(scanResult);
          onScan?.(scanResult.text, scanResult.format);
          console.log('Barcode detected:', scanResult);
        }
      }
    } catch (err) {
      // ZXing throws errors when no barcode is found, which is normal
      // Only log actual errors
      if (err instanceof Error && !err.message.includes('No barcode found')) {
        console.warn('Scanning error:', err.message);
      }
    }
  };

  const switchCamera = async () => {
    if (!streamRef.current) return;

    try {
      // Stop current stream
      streamRef.current.getTracks().forEach(track => track.stop());

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length < 2) {
        onError?.('No additional cameras available');
        return;
      }

      // Toggle between front and back camera
      const currentConstraints = streamRef.current.getVideoTracks()[0].getSettings();
      const newFacingMode = currentConstraints.facingMode === 'environment' ? 'user' : 'environment';

      // Request new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

    } catch (err) {
      console.error('Error switching camera:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch camera';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <div className="barcode-scanner" style={{ position: 'relative', width, height }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          background: '#000'
        }}
        playsInline
        muted
      />
      
      {/* Scanner overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '250px',
          height: '150px',
          border: '2px solid #00ff00',
          borderRadius: '8px',
          pointerEvents: 'none'
        }}
      />

      {/* Status indicators */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}
      >
        {isScanning ? 'Scanning...' : hasPermission === false ? 'Camera denied' : 'Ready'}
      </div>

      {/* Camera switch button */}
      <button
        onClick={switchCamera}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
        disabled={!isScanning}
      >
        Switch Camera
      </button>

      {/* Error display */}
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          {error}
        </div>
      )}

      {/* Last scan result */}
      {lastScanResult && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            background: 'rgba(0, 255, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          Last scan: {lastScanResult.format} - {lastScanResult.text.substring(0, 20)}...
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner; 