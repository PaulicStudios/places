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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScanningRef = useRef<boolean>(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  // Initialize ZXing reader
  useEffect(() => {
    console.log('🔧 Initializing ZXing BrowserMultiFormatReader...');
    try {
      readerRef.current = new BrowserMultiFormatReader();
      
      // Configure reader with hints for better detection
      const hints = new Map();
      // Enable common barcode formats
      hints.set('POSSIBLE_FORMATS', [
        'QR_CODE',
        'DATA_MATRIX', 
        'UPC_A',
        'UPC_E',
        'EAN_8',
        'EAN_13',
        'CODE_128',
        'CODE_39',
        'CODE_93',
        'CODABAR',
        'ITF',
        'RSS_14',
        'RSS_EXPANDED'
      ]);
      hints.set('TRY_HARDER', true);
      hints.set('CHARACTER_SET', 'UTF-8');
      
      // Apply hints to reader
      readerRef.current.hints = hints;
      
      console.log('✅ ZXing reader initialized successfully with enhanced format support');
      setDebugInfo('ZXing reader ready with enhanced detection');
    } catch (err) {
      console.error('❌ Failed to initialize ZXing reader:', err);
      setDebugInfo('ZXing initialization failed');
    }
    
    return () => {
      if (readerRef.current) {
        console.log('🧹 Cleaning up ZXing reader');
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
      console.log('📷 Requesting camera permission...');
      setDebugInfo('Requesting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('✅ Camera permission granted, stream:', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks());
      
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      setDebugInfo('Camera ready');
      onPermissionGranted?.();
      return true;
    } catch (err) {
      console.error('❌ Camera permission denied:', err);
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMessage);
      setHasPermission(false);
      setDebugInfo(`Camera error: ${errorMessage}`);
      onPermissionDenied?.();
      onError?.(errorMessage);
      return false;
    }
  };

  const startScanning = async () => {
    console.log('🚀 Starting scanner...');
    if (isScanning || !videoRef.current || !readerRef.current) {
      console.log('⚠️ Cannot start scanning:', { isScanning, videoRef: !!videoRef.current, readerRef: !!readerRef.current });
      return;
    }

    try {
      // Request camera permission if not already granted
      if (!streamRef.current) {
        const permissionGranted = await requestCameraPermission();
        if (!permissionGranted) return;
      }

      // Attach stream to video element
      if (videoRef.current && streamRef.current) {
        console.log('📹 Attaching stream to video element...');
        videoRef.current.srcObject = streamRef.current;
        
        // Wait for video to be ready
        const playPromise = videoRef.current.play();
        await playPromise;
        
        console.log('✅ Video playing, dimensions:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState
        });
        
        setDebugInfo(`Video ready: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
      }

      setIsScanning(true);
      isScanningRef.current = true;

      // Start scanning interval
      console.log('⏰ Starting scan interval (every 100ms)...');
      let intervalCount = 0;
      scanIntervalRef.current = setInterval(async () => {
        intervalCount++;
        console.log(`📍 Interval tick #${intervalCount} - calling scanFrame`);
        await scanFrame();
      }, 100); // Scan every 100ms

      console.log('✅ Scan interval started successfully:', scanIntervalRef.current);

    } catch (err) {
      console.error('❌ Error starting scanner:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start scanner';
      setError(errorMessage);
      setDebugInfo(`Start error: ${errorMessage}`);
      onError?.(errorMessage);
    }
  };

  const stopScanning = useCallback(() => {
    console.log('⏹️ Stopping scanner...');
    setIsScanning(false);
    isScanningRef.current = false;

    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
      console.log('⏰ Scan interval cleared');
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      console.log('📹 Video stream stopped');
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setHasPermission(null);
    setDebugInfo('Scanner stopped');
  }, []);

  const scanFrame = async () => {
    console.log('🔄 scanFrame called, checking conditions...', {
      hasVideoRef: !!videoRef.current,
      hasCanvasRef: !!canvasRef.current,
      hasReaderRef: !!readerRef.current,
      isScanning: isScanning,
      isScanningRef: isScanningRef.current,
      videoReadyState: videoRef.current?.readyState
    });

    if (!videoRef.current || !canvasRef.current || !readerRef.current || !isScanningRef.current) {
      console.log('❌ scanFrame early exit:', {
        videoRef: !!videoRef.current,
        canvasRef: !!canvasRef.current,
        readerRef: !!readerRef.current,
        isScanning: isScanning,
        isScanningRef: isScanningRef.current
      });
      return;
    }

    try {
      // Check if video is ready
      if (videoRef.current.readyState < 2) {
        console.log('⏳ Video not ready yet, readyState:', videoRef.current.readyState);
        return;
      }

      // Capture frame to canvas
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        console.warn('❌ Could not get canvas context');
        return;
      }

      // Set canvas dimensions to match video
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Enhance image for better barcode detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Increase contrast and brightness more aggressively for linear barcodes
      for (let i = 0; i < data.length; i += 4) {
        // Apply stronger contrast enhancement for linear barcodes
        const contrast = 1.5; // 50% more contrast (increased from 1.2)
        const brightness = 20; // More brightness boost (increased from 10)
        
        // Convert to grayscale first for better linear barcode detection
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const enhanced = Math.min(255, Math.max(0, contrast * (gray - 128) + 128 + brightness));
        
        // Apply enhanced grayscale value to all RGB channels
        data[i] = enhanced;     // Red
        data[i + 1] = enhanced; // Green  
        data[i + 2] = enhanced; // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      // Put enhanced image data back to canvas
      context.putImageData(imageData, 0, 0);

      console.log('🔍 Attempting to decode frame from canvas...', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        videoTime: video.currentTime
      });

      // Convert canvas to data URL and create image element
      const dataUrl = canvas.toDataURL('image/png');
      const image = new Image();
      
      // Debug: Save processed frame occasionally for inspection
      if (Math.random() < 0.05) { // 5% chance (~once every 2 seconds)
        console.log('🖼️ Debug frame saved. You can copy this data URL to see processed image:', dataUrl.substring(0, 100) + '...');
        console.log('📋 Full data URL for inspection:', dataUrl);
      }
      
      // Use Promise to handle image loading
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load canvas image'));
        image.src = dataUrl;
      });
      
      // Try multiple scanning strategies for linear barcodes
      let result: Result | null = null;
      
      try {
        // Strategy 1: Try full image decode
        result = await readerRef.current.decodeFromImage(image);
      } catch (err) {
        // Strategy 2: Try scanning different regions for linear barcodes
        try {
          // Create smaller region-focused canvases for linear barcode scanning
          const regionCanvas = document.createElement('canvas');
          const regionContext = regionCanvas.getContext('2d');
          
          if (regionContext) {
            // Scan center horizontal strip (where linear barcodes often are)
            const stripHeight = Math.floor(canvas.height * 0.3); // 30% of height
            const stripY = Math.floor((canvas.height - stripHeight) / 2);
            
            regionCanvas.width = canvas.width;
            regionCanvas.height = stripHeight;
            
            // Copy the center horizontal strip
            regionContext.drawImage(canvas, 0, stripY, canvas.width, stripHeight, 0, 0, canvas.width, stripHeight);
            
            const regionDataUrl = regionCanvas.toDataURL('image/png');
            const regionImage = new Image();
            
            await new Promise<void>((resolve, reject) => {
              regionImage.onload = () => resolve();
              regionImage.onerror = () => reject(new Error('Failed to load region image'));
              regionImage.src = regionDataUrl;
            });
            
            result = await readerRef.current.decodeFromImage(regionImage);
            console.log('📏 Linear barcode detected in center strip!');
          }
        } catch (err2) {
          // Both strategies failed - normal for no barcode present
        }
      }
      
      if (result) {
        console.log('🎯 BARCODE DETECTED!', {
          text: result.getText(),
          format: result.getBarcodeFormat().toString(),
          points: result.getResultPoints()
        });

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
          setDebugInfo(`Detected: ${scanResult.format}`);
          onScan?.(scanResult.text, scanResult.format);
          console.log('✅ Barcode scan reported to parent component');
        } else {
          console.log('🔄 Duplicate scan ignored');
        }
      } else {
        // This shouldn't happen as ZXing throws on no result
        console.log('⚠️ No result returned from decoder');
      }
    } catch (err) {
      // ZXing throws errors when no barcode is found, which is normal
      // Only log actual errors
      if (err instanceof Error) {
        if (!err.message.includes('No barcode found') && 
            !err.message.includes('No MultiFormat Readers were able to detect the code') &&
            !err.message.includes('NotFoundException')) {
          console.warn('🚨 Scanning error:', err.message);
          setDebugInfo(`Scan error: ${err.message}`);
        }
        // Log scan attempts every 50 tries (5 seconds) - but only log the "no barcode" once
        if (Math.random() < 0.02) { // ~2% chance
          console.log('🔍 Still scanning... (no barcode detected yet)', err.message);
        }
      }
    }
  };

  const switchCamera = async () => {
    if (!streamRef.current) return;

    try {
      console.log('🔄 Switching camera...');
      
      // Stop current stream
      streamRef.current.getTracks().forEach(track => track.stop());

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📷 Available cameras:', videoDevices.length);
      
      if (videoDevices.length < 2) {
        onError?.('No additional cameras available');
        return;
      }

      // Toggle between front and back camera
      const currentConstraints = streamRef.current.getVideoTracks()[0].getSettings();
      const newFacingMode = currentConstraints.facingMode === 'environment' ? 'user' : 'environment';

      console.log('🔄 Switching from', currentConstraints.facingMode, 'to', newFacingMode);

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
      console.error('❌ Error switching camera:', err);
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
      
      {/* Hidden canvas for frame capture */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden'
        }}
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

      {/* Debug info */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#00ff00',
          padding: '5px',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}
      >
        Debug: {debugInfo}
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