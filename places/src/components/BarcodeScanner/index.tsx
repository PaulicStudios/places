'use client';

import { Button, LiveFeedback, Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera } from 'iconoir-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScanResult?: (result: string) => void;
  onClose?: () => void;
  autoStart?: boolean;
  continuousScanning?: boolean;
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
  const [isScanning, setIsScanning] = useState(false); // Don't auto-start immediately
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize code reader once
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    
    return () => {
      stopStreamAndReset();
    };
  }, []);
  
  // Handle autoStart
  useEffect(() => {
    if (autoStart && !isScanning && !scanResult) {
      handleStartButtonClick();
    }
  }, [autoStart]);

  // Clean up function to stop streams and reset reader
  const stopStreamAndReset = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null);
      let stream;
      
      // Try to get the back camera first
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { exact: 'environment' } }
        });
      } catch {
        // Fall back to any available camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      }
      
      // Just checking we can access it, stop it immediately
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      console.log("Camera permission granted");
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError': 
            setError('Camera permission denied. Please enable camera access in your browser settings.');
            break;
          case 'NotFoundError': 
            setError('No camera found on this device.');
            break;
          case 'NotSupportedError': 
            setError('Camera access is not supported in this browser.');
            break;
          default: 
            setError('Failed to access camera. Please check your permissions.');
        }
      } else {
        setError('Failed to request camera permission');
      }
      return false;
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current) {
      console.warn("startScanning: codeReader or videoRef not ready.");
      setIsScanning(false);
      return;
    }
    
    // Clear previous state
    setError(null);
    stopStreamAndReset();
    
    // Check permissions if needed
    if (hasPermission === null) {
      const permissionGranted = await requestCameraPermission();
      if (!permissionGranted) {
        setIsScanning(false);
        return;
      }
    } else if (hasPermission === false) {
      setError('Camera permission is required to scan.');
      setIsScanning(false);
      return;
    }

    try {
      const reader = codeReaderRef.current;
      console.log("Starting barcode scanning...");
      
      const videoInputDevices = await reader.listVideoInputDevices();
      console.log("Available cameras:", videoInputDevices.length);
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }
      
      // Try to use back camera if available
      let selectedDeviceId = videoInputDevices[0].deviceId;
      const backCamera = videoInputDevices.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || label.includes('environment') || label.includes('rear');
      });
      
      if (backCamera) {
        console.log("Using back camera");
        selectedDeviceId = backCamera.deviceId;
      }

      reader.timeBetweenDecodingAttempts = 200;
      
      // Set up continuous scanning with custom handler
      if (continuousScanning) {
        reader.decodeFromVideoDevice(
          selectedDeviceId, 
          videoRef.current, 
          (result, error) => {
            if (result) {
              console.log("Barcode detected:", result.getText());
              setScanResult(result.getText());
              onScanResult?.(result.getText());
              stopStreamAndReset();
              setIsScanning(false);
            }
            
            if (error && !(error instanceof NotFoundException)) {
              console.error("Scanning error:", error);
              if (error.message.includes('permission')) {
                setError('Camera permission issue. Please refresh and try again.');
              } else {
                setError('Scanner error: ' + error.message);
              }
              stopStreamAndReset();
              setIsScanning(false);
            }
          }
        );
      } else {
        // Single scan mode
        try {
          const result = await reader.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current);
          if (result) {
            console.log("Barcode detected:", result.getText());
            setScanResult(result.getText());
            onScanResult?.(result.getText());
          }
        } catch (err) {
          if (err instanceof NotFoundException) {
            setError('No barcode found. Please try again.');
          } else {
            throw err; // Re-throw for the outer catch
          }
        } finally {
          stopStreamAndReset();
          setIsScanning(false);
        }
      }
    } catch (err) {
      console.error("Scanner setup error:", err);
      setError(err instanceof Error ? err.message : 'Failed to start scanner');
      stopStreamAndReset();
      setIsScanning(false);
    }
  }, [hasPermission, onScanResult, continuousScanning, requestCameraPermission, stopStreamAndReset]);

  useEffect(() => {
    if (isScanning && !scanResult) {
      startScanning();
    }
  }, [isScanning, scanResult, startScanning]);

  const handleStartButtonClick = () => {
    setError(null);
    setScanResult(null);
    setIsScanning(true);
  };

  const stopScanning = () => {
    stopStreamAndReset();
    setIsScanning(false);
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  const retryScanning = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
  };

  return (
    <div className={`relative w-full max-w-md mx-auto p-4 bg-gray-900 rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Camera View or Placeholder */}
      {isScanning && (
        <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
      <div className="w-full space-y-4">
        {!isScanning && !scanResult && (
          <Button
            variant="primary"
            onClick={handleStartButtonClick}
            className="w-full flex items-center justify-center h-6 rounded-full"
            style={{ borderRadius: '9999px' }}
            disabled={hasPermission === false}
          >
            <Camera className="mr-2 w-5 h-5" />
            {hasPermission === false ? 'Permission Denied' : 'Scan Barcode'}
          </Button>
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
