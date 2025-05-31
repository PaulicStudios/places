'use client';

import { Button, LiveFeedback, Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, Refresh } from 'iconoir-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
  onScanResult?: (result: string) => void;
  onClose?: () => void;
  autoStart?: boolean; // Auto-start scanning immediately
  continuousScanning?: boolean; // Continue scanning after finding results
}

export const BarcodeScanner = ({ 
  onScanResult, 
  onClose, 
  autoStart = true, 
  continuousScanning = true 
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(autoStart);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  useEffect(() => {
    // Initialize the code reader
    const reader = new BrowserMultiFormatReader();
    setCodeReader(reader);

    // Capture the current video element reference
    const currentVideoElement = videoRef.current;

    // Add event listeners to handle video stream events
    const handleVideoEnded = () => {
      console.log('Video stream ended');
      setIsScanning(false);
      setError(null); // Don't show error when stream ends naturally
    };

    const handleVideoError = (event: Event) => {
      console.log('Video error occurred:', event);
      setIsScanning(false);
      // Only show error if we were actively scanning
      if (isScanning) {
        setError('Camera connection lost. Please try again.');
      }
    };

    if (currentVideoElement) {
      currentVideoElement.addEventListener('ended', handleVideoEnded);
      currentVideoElement.addEventListener('error', handleVideoError);
    }

    return () => {
      // Cleanup on unmount
      try {
        reader.reset();
        
        // Remove event listeners
        if (currentVideoElement) {
          currentVideoElement.removeEventListener('ended', handleVideoEnded);
          currentVideoElement.removeEventListener('error', handleVideoError);
          
          // Stop any active video streams
          if (currentVideoElement.srcObject) {
            const stream = currentVideoElement.srcObject as MediaStream;
            stream.getTracks().forEach(track => {
              track.stop();
            });
          }
        }
      } catch (err) {
        console.error('Error during cleanup:', err);
        // Don't throw, just log the error
      }
    };
  }, [isScanning]); // Add isScanning to dependencies

  // Separate effect for auto-start to avoid dependency issues
  useEffect(() => {
    if (autoStart && codeReader) {
      // Delay to ensure component is mounted
      const timer = setTimeout(() => {
        if (!isScanning) {
          setIsScanning(true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, codeReader, isScanning]);

  const requestCameraPermission = useCallback(async () => {
    try {
      setError(null);
      
      // For better camera support, try different access strategies
      let stream;
      
      try {
        // First try with environment (back) camera as default
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { exact: 'environment' }
          } 
        });
      } catch {
        try {
          // Fallback to preferred environment mode
          console.log('Exact environment camera not available, trying preferred mode');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment'
            } 
          });
        } catch {
          // Final fallback - just request any camera
          console.log('Environment camera not available, requesting any camera');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true
          });
        }
      }
      
      stream.getTracks().forEach(track => track.stop()); 
      setHasPermission(true);
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
    if (!codeReader || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);

      if (hasPermission === null) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) {
          setIsScanning(false);
          return;
        }
      }

      const videoInputDevices = await codeReader.listVideoInputDevices();
      setAvailableCameras(videoInputDevices);
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      let selectedDeviceId: string;
      
      console.log('Available cameras:', videoInputDevices.map((device, index) => 
        `${index}: ${device.label} (${device.deviceId.slice(0, 10)}...)`));
      
      // Use the currentCameraIndex if it's valid, otherwise try to find the best default camera
      if (currentCameraIndex < videoInputDevices.length) {
        selectedDeviceId = videoInputDevices[currentCameraIndex].deviceId;
        console.log(`Using camera at index ${currentCameraIndex}:`, videoInputDevices[currentCameraIndex].label);
      } else {
        // Reset to 0 if index is out of bounds and find the best default camera
        setCurrentCameraIndex(0);
        
        // Try to find back camera as default, especially for iPhones
        const isIPhone = navigator.userAgent.includes('iPhone');
        const backCamera = videoInputDevices.find(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') || 
                 label.includes('environment') || 
                 label.includes('rear') ||
                 label.includes('main');
        });
        
        if (backCamera) {
          const backIndex = videoInputDevices.indexOf(backCamera);
          setCurrentCameraIndex(backIndex);
          selectedDeviceId = backCamera.deviceId;
          console.log('Using back camera as default:', backCamera.label);
        } else if (videoInputDevices.length > 1 && isIPhone) {
          // For iPhone, try index 1 as it's often the back camera
          const fallbackIndex = 1;
          setCurrentCameraIndex(fallbackIndex);
          selectedDeviceId = videoInputDevices[fallbackIndex].deviceId;
          console.log(`Using camera ${fallbackIndex} as iPhone fallback:`, 
                     videoInputDevices[fallbackIndex].label);
        } else {
          selectedDeviceId = videoInputDevices[0].deviceId;
          console.log('Using first camera as default:', videoInputDevices[0].label);
        }
      }

      const result = await codeReader.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current);
      
      if (result) {
        // Stop all camera resources immediately on successful scan
        try {
          if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => {
              track.stop();
            });
            videoRef.current.srcObject = null;
          }
          codeReader.reset();
        } catch (err) {
          console.error('Error stopping camera:', err);
        }
        
        setScanResult(result.getText());
        onScanResult?.(result.getText());
        
        // If continuous scanning is enabled, keep scanning after a brief delay
        if (continuousScanning) {
          setTimeout(() => {
            setScanResult(null); // Clear the result
            // Continue scanning if we're still in scanning mode
            if (isScanning) {
              startScanning();
            }
          }, 1500); // Show result for 1.5 seconds before continuing
        } else {
          setIsScanning(false);
        }
      }
    } catch (err) {
      console.error('Scanning error:', err);
      
      if (err instanceof NotFoundException) {
        console.log('No barcode detected, continuing...');
      } else if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        
        if (errorMessage.includes('video stream has ended') || 
            errorMessage.includes('stream ended') ||
            errorMessage.includes('video stream')) {
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
      
      setIsScanning(false);
    }
  }, [codeReader, videoRef, hasPermission, onScanResult, continuousScanning, isScanning, currentCameraIndex, requestCameraPermission]);

  useEffect(() => {
    if (isScanning && codeReader) {
      startScanning();
    }
  }, [isScanning, codeReader, startScanning]);

  // Initialize camera index when cameras are first discovered
  useEffect(() => {
    if (availableCameras.length > 0 && currentCameraIndex >= availableCameras.length) {
      // Find the best default camera (preferably back camera)
      const isIPhone = navigator.userAgent.includes('iPhone');
      const backCamera = availableCameras.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || 
               label.includes('environment') || 
               label.includes('rear') ||
               label.includes('main');
      });
      
      if (backCamera) {
        setCurrentCameraIndex(availableCameras.indexOf(backCamera));
      } else if (availableCameras.length > 1 && isIPhone) {
        // For iPhone, try index 1 as it's often the back camera
        setCurrentCameraIndex(1);
      } else {
        setCurrentCameraIndex(0);
      }
    }
  }, [availableCameras, currentCameraIndex]);

  const stopScanning = () => {
    try {
      if (codeReader) {
        codeReader.reset();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
    
    setIsScanning(false);
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  const retryScanning = () => {
    setScanResult(null);
    setError(null);
    startScanning();
  };

  const switchCamera = () => {
    if (availableCameras.length > 1) {
      // Cycle to the next camera
      setCurrentCameraIndex((prev) => (prev + 1) % availableCameras.length);
      
      if (isScanning) {
        // Stop current scanning and restart with new camera
        stopScanning();
        setTimeout(() => {
          setIsScanning(true);
        }, 100);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative w-full max-w-md aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {/* Camera switch button - only show when multiple cameras are available */}
        {availableCameras.length > 1 && (
          <button
            onClick={switchCamera}
            className="absolute top-3 right-3 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200 z-10"
            aria-label="Switch camera"
          >
            <Refresh className="w-5 h-5 text-white" />
          </button>
        )}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full space-y-4">
        {!isScanning && !scanResult && (
          <LiveFeedback
            state={hasPermission === false ? 'failed' : undefined}
            className="w-full"
          >
            <Button
              onClick={startScanning}
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

        {isScanning && (
          <Button
            onClick={stopScanning}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Stop Scanning
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

      <Typography className="text-gray-600 text-center max-w-md">
        Position the barcode within the camera frame. The scanner will automatically detect and read the code.
      </Typography>
    </div>
  );
};
