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
  const cameraInitialized = useRef(false);
  const switchingCamera = useRef(false);
  const initializing = useRef(false);
  const [isScanning, setIsScanning] = useState(false); // Don't auto-start immediately
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

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
      
      // Add loadedmetadata event to track when video is ready
      const handleVideoReady = () => {
        console.log('Video metadata loaded, video is ready');
        setIsVideoReady(true);
      };
      
      // Add playing event as backup for when video actually starts playing
      const handleVideoPlaying = () => {
        console.log('Video is playing, marking as ready');
        setIsVideoReady(true);
      };
      
      currentVideoElement.addEventListener('loadedmetadata', handleVideoReady);
      currentVideoElement.addEventListener('playing', handleVideoPlaying);
      
      // Store references for cleanup
      (currentVideoElement as HTMLVideoElement & { __handleVideoReady?: () => void, __handleVideoPlaying?: () => void }).__handleVideoReady = handleVideoReady;
      (currentVideoElement as HTMLVideoElement & { __handleVideoReady?: () => void, __handleVideoPlaying?: () => void }).__handleVideoPlaying = handleVideoPlaying;
    }

    return () => {
      // Cleanup on unmount
      try {
        reader.reset();
        
        // Remove event listeners
        if (currentVideoElement) {
          currentVideoElement.removeEventListener('ended', handleVideoEnded);
          currentVideoElement.removeEventListener('error', handleVideoError);
          
          // Get stored references and remove them
          const storedHandleVideoReady = (currentVideoElement as HTMLVideoElement & { __handleVideoReady?: () => void }).__handleVideoReady;
          const storedHandleVideoPlaying = (currentVideoElement as HTMLVideoElement & { __handleVideoPlaying?: () => void }).__handleVideoPlaying;
          
          if (storedHandleVideoReady) {
            currentVideoElement.removeEventListener('loadedmetadata', storedHandleVideoReady);
          }
          if (storedHandleVideoPlaying) {
            currentVideoElement.removeEventListener('playing', storedHandleVideoPlaying);
          }
          
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
    if (autoStart && codeReader && !cameraInitialized.current && !switchingCamera.current) {
      // Only auto-start after camera initialization is complete
      const timer = setTimeout(() => {
        if (!isScanning && cameraInitialized.current) {
          console.log('Auto-starting scanner after camera initialization');
          setIsScanning(true);
        }
      }, 500); // Longer delay to ensure camera setup is complete
      
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

  // Handle camera initialization when cameras are discovered
  const handleCamerasDiscovered = useCallback((cameras: MediaDeviceInfo[]) => {
    // Prevent multiple initializations
    if (cameras.length > 0 && !cameraInitialized.current && !initializing.current) {
      initializing.current = true;
      console.log('Starting camera initialization...');
      
      const isIPhone = navigator.userAgent.includes('iPhone');
      const isAndroid = navigator.userAgent.toLowerCase().includes('android');
      
      console.log('Initializing camera selection for:', { 
        isIPhone, 
        isAndroid, 
        availableCameras: cameras.length,
        cameraLabels: cameras.map((cam, idx) => `${idx}: ${cam.label}`)
      });
      
      // Enhanced back camera detection with more patterns
      const backCamera = cameras.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || 
               label.includes('environment') || 
               label.includes('rear') ||
               label.includes('main') ||
               label.includes('camera2 0') ||
               label.includes('0, facing back') ||
               label.includes('facing back') ||
               (isAndroid && label.includes('camera 0'));
      });
      
      let preferredIndex = 0;
      
      if (backCamera) {
        preferredIndex = cameras.indexOf(backCamera);
        console.log('Found back camera by label at index:', preferredIndex, backCamera.label);
      } else if (cameras.length > 1) {
        if (isIPhone) {
          // For iPhone, try to avoid front-facing cameras
          const nonFrontCamera = cameras.find((device) => {
            const label = device.label.toLowerCase();
            return !label.includes('front') && !label.includes('user') && !label.includes('selfie');
          });
          
          if (nonFrontCamera) {
            preferredIndex = cameras.indexOf(nonFrontCamera);
            console.log('Found non-front camera at index:', preferredIndex, nonFrontCamera.label);
          } else {
            // Fallback: use second camera if available (usually back camera on iPhone)
            preferredIndex = Math.min(1, cameras.length - 1);
            console.log('Using iPhone fallback index:', preferredIndex);
          }
        } else if (isAndroid) {
          // For Android, back camera is usually at index 0, but let's be more intelligent
          const possibleBackCameras = cameras.filter((device) => {
            const label = device.label.toLowerCase();
            // Avoid cameras with "front" in the name
            return !label.includes('front') && !label.includes('user') && !label.includes('selfie');
          });
          
          if (possibleBackCameras.length > 0) {
            preferredIndex = cameras.indexOf(possibleBackCameras[0]);
            console.log('Found potential back camera on Android at index:', preferredIndex, possibleBackCameras[0].label);
          } else {
            preferredIndex = 0;
            console.log('Using Android default index 0 (no clear back camera found)');
          }
        } else {
          preferredIndex = 0;
          console.log('Using default index 0 for unknown device');
        }
      }
      
      console.log('Setting initial camera index to:', preferredIndex);
      setCurrentCameraIndex(preferredIndex);
      
      // Mark initialization as complete
      setTimeout(() => {
        cameraInitialized.current = true;
        initializing.current = false;
        console.log('Camera initialization complete');
      }, 100);
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (!codeReader || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);
      setIsVideoReady(false); // Reset video ready state

      if (hasPermission === null) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) {
          setIsScanning(false);
          return;
        }
      }

      const videoInputDevices = await codeReader.listVideoInputDevices();
      setAvailableCameras(videoInputDevices);
      
      // Initialize camera selection if needed (only once)
      if (!cameraInitialized.current) {
        handleCamerasDiscovered(videoInputDevices);
      }
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      let selectedDeviceId: string;
      
      console.log('Available cameras:', videoInputDevices.map((device, index) => 
        `${index}: ${device.label} (${device.deviceId.slice(0, 10)}...)`));
      
      // Always use the currentCameraIndex if it's valid
      if (currentCameraIndex < videoInputDevices.length) {
        selectedDeviceId = videoInputDevices[currentCameraIndex].deviceId;
        console.log(`Using camera at index ${currentCameraIndex}:`, videoInputDevices[currentCameraIndex].label);
      } else {
        // If index is out of bounds, reset to 0
        console.log(`Camera index ${currentCameraIndex} out of bounds, resetting to 0`);
        setCurrentCameraIndex(0);
        selectedDeviceId = videoInputDevices[0].deviceId;
        console.log('Using first camera as fallback:', videoInputDevices[0].label);
      }

      const result = await codeReader.decodeOnceFromVideoDevice(selectedDeviceId, videoRef.current);
      
      // Enhanced video ready detection with multiple checks
      const checkVideoReady = () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const hasValidDimensions = videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0;
          const isStreamActive = stream.active;
          
          if (isStreamActive && hasValidDimensions) {
            console.log('Video stream is ready:', {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
              active: isStreamActive
            });
            setIsVideoReady(true);
            return true;
          }
        }
        return false;
      };
      
      // Check immediately
      if (!checkVideoReady()) {
        // If not ready immediately, set up polling
        console.log('Video not immediately ready, starting polling...');
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max
        
        const pollForReady = setInterval(() => {
          attempts++;
          if (checkVideoReady() || attempts >= maxAttempts) {
            clearInterval(pollForReady);
            if (attempts >= maxAttempts) {
              console.log('Video ready polling timeout - forcing ready state');
              setIsVideoReady(true);
            }
          }
        }, 100);
      }
      
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
        
        // Handle canvas/getImageData errors specifically
        if (errorMessage.includes('getimagedata') || 
            errorMessage.includes('source width is 0') ||
            errorMessage.includes('the source width is 0') ||
            errorMessage.includes('canvas') ||
            errorMessage.includes('video dimensions') ||
            errorMessage.includes('videowidth') ||
            errorMessage.includes('videoheight')) {
          console.log('Canvas/video dimension error detected, waiting for video to stabilize...');
          // Don't show error to user, just retry after video stabilizes
          setTimeout(() => {
            if (isScanning && !switchingCamera.current && videoRef.current) {
              // Check if video has valid dimensions before retrying
              if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                console.log('Video stabilized, retrying scan...');
                startScanning();
              } else {
                console.log('Video still not ready, waiting longer...');
                setTimeout(() => {
                  if (isScanning && !switchingCamera.current) {
                    startScanning();
                  }
                }, 500);
              }
            }
          }, 300);
          return; // Don't set error state for canvas issues
        } else if (errorMessage.includes('video stream has ended') || 
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
  }, [codeReader, videoRef, hasPermission, onScanResult, continuousScanning, isScanning, currentCameraIndex, requestCameraPermission, handleCamerasDiscovered]);

  useEffect(() => {
    // Only start scanning if we're not switching cameras and camera is initialized
    if (isScanning && codeReader && !switchingCamera.current && cameraInitialized.current) {
      console.log('Starting scanning with camera index:', currentCameraIndex);
      startScanning();
    }
  }, [isScanning, codeReader, startScanning, currentCameraIndex]);

  // Add a polling mechanism to check video readiness after camera switching
  useEffect(() => {
    if (isScanning && !isVideoReady && !isSwitchingCamera && videoRef.current) {
      const checkVideoReady = () => {
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          console.log('Video ready detected via polling');
          setIsVideoReady(true);
          return true;
        }
        return false;
      };
      
      // Check immediately
      if (checkVideoReady()) return;
      
      // Then check every 100ms for up to 3 seconds
      const interval = setInterval(() => {
        if (checkVideoReady()) {
          clearInterval(interval);
        }
      }, 100);
      
      const timeout = setTimeout(() => {
        clearInterval(interval);
        console.log('Video ready timeout - forcing ready state');
        setIsVideoReady(true);
      }, 3000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isScanning, isVideoReady, isSwitchingCamera]);

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

  const switchCamera = useCallback(async () => {
    // Prevent rapid clicking and ensure we have multiple cameras
    if (switchingCamera.current || availableCameras.length <= 1) {
      console.log('Camera switch blocked:', { switching: switchingCamera.current, availableCameras: availableCameras.length });
      return;
    }
    
    const wasScanning = isScanning;
    switchingCamera.current = true;
    setIsSwitchingCamera(true); // Set state for UI updates
    setIsVideoReady(false); // Reset video ready state
    console.log(`Starting camera switch from ${currentCameraIndex} to ${(currentCameraIndex + 1) % availableCameras.length}`);
    
    try {
      // Step 1: Pause scanning completely
      if (wasScanning) {
        console.log('Pausing scanning for camera switch...');
        setIsScanning(false);
        
        // Wait for scanning to stop
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Step 2: Stop current camera stream properly to avoid canvas issues
      try {
        if (codeReader) {
          console.log('Resetting code reader...');
          codeReader.reset();
        }
        if (videoRef.current && videoRef.current.srcObject) {
          console.log('Stopping video stream...');
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            track.stop();
          });
          videoRef.current.srcObject = null;
        }
      } catch (err) {
        console.error('Error stopping camera during switch:', err);
      }
      
      // Step 3: Wait for camera resources to be fully released
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Step 4: Cycle to the next camera
      const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
      console.log(`Setting camera index to: ${nextIndex} (${availableCameras[nextIndex]?.label})`);
      setCurrentCameraIndex(nextIndex);
      
      // Step 5: Reset switching flags immediately after camera index is set
      switchingCamera.current = false;
      console.log('Camera switching flag reset - ready for new camera');
      
      // Step 6: Wait for the state to update and then resume scanning
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 7: Resume scanning if it was previously active
      if (wasScanning) {
        console.log('Resuming scanning with new camera...');
        setIsScanning(true);
        
        // Wait for the new video stream to be ready before resetting UI state
        const waitForVideoReady = () => {
          return new Promise<void>((resolve) => {
            if (!videoRef.current) {
              resolve();
              return;
            }
            
            const checkVideo = () => {
              if (videoRef.current && 
                  videoRef.current.srcObject && 
                  videoRef.current.videoWidth > 0 && 
                  videoRef.current.videoHeight > 0) {
                console.log('New camera video stream is ready');
                setIsVideoReady(true);
                resolve();
                return true;
              }
              return false;
            };
            
            // Check immediately
            if (checkVideo()) return;
            
            // Set up polling with a reasonable timeout
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds max
            const pollInterval = setInterval(() => {
              attempts++;
              if (checkVideo() || attempts >= maxAttempts) {
                clearInterval(pollInterval);
                if (attempts >= maxAttempts) {
                  console.log('Video ready timeout during camera switch - forcing ready state');
                  setIsVideoReady(true);
                }
                resolve();
              }
            }, 100);
          });
        };
        
        // Wait for video to be ready then reset switching state
        waitForVideoReady().then(() => {
          setTimeout(() => {
            setIsSwitchingCamera(false);
            console.log('UI switching state reset - video is ready');
          }, 200);
        });
      } else {
        setIsSwitchingCamera(false);
      }
      
      console.log('Camera switch complete');
    } catch (err) {
      console.error('Error during camera switch:', err);
      // Reset state on error
      switchingCamera.current = false;
      setIsSwitchingCamera(false);
      if (wasScanning) {
        setIsScanning(true);
      }
    }
  }, [availableCameras, currentCameraIndex, codeReader, isScanning]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative w-full max-w-md aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {/* Video element */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isVideoReady && !isSwitchingCamera ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          playsInline
          muted
        />
        
        {/* Video placeholder when not ready */}
        {(!isVideoReady || isSwitchingCamera) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <Typography className="text-lg font-medium mb-2">
                {isSwitchingCamera ? 'Switching Camera...' : ''}
              </Typography>
              <Typography className="text-sm opacity-75">
                {isSwitchingCamera ? 'Please wait while we switch cameras' : ''}
              </Typography>
            </div>
          </div>
        )}
        
        {/* Camera switch button - only show when multiple cameras are available */}
        {availableCameras.length > 1 && (
          <button
            onClick={switchCamera}
            disabled={isSwitchingCamera}
            className={`absolute top-3 right-3 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
              isSwitchingCamera ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Switch camera"
          >
            <Refresh className={`w-5 h-5 text-white ${isSwitchingCamera ? 'animate-spin' : ''}`} />
          </button>
        )}
        
        {/* Scanning overlay - only show when actively scanning */}
        {isScanning && isVideoReady && !isSwitchingCamera && (
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
