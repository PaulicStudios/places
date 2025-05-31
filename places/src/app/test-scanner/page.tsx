'use client';

import React, { useState } from 'react';
import BarcodeScanner from '@/components/BarcodeScanner';

export default function TestScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResults, setScannedResults] = useState<Array<{text: string, format: string, timestamp: number}>>([]);

  const handleScan = (result: string, format: string) => {
    console.log('Barcode scanned:', { result, format });
    
    const newScan = {
      text: result,
      format: format,
      timestamp: Date.now()
    };
    
    setScannedResults(prev => [newScan, ...prev.slice(0, 9)]); // Keep last 10 results
    
    // Auto-stop scanning after successful scan for testing
    setTimeout(() => {
      setIsScanning(false);
    }, 2000);
  };

  const handleError = (error: string) => {
    console.error('Scanner error:', error);
    alert(`Scanner Error: ${error}`);
  };

  const handlePermissionGranted = () => {
    console.log('Camera permission granted');
  };

  const handlePermissionDenied = () => {
    console.error('Camera permission denied');
    alert('Camera permission is required for barcode scanning');
  };

  const clearResults = () => {
    setScannedResults([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Barcode Scanner Test
      </h1>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setIsScanning(!isScanning)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isScanning ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {isScanning ? 'Stop Scanner' : 'Start Scanner'}
        </button>

        {scannedResults.length > 0 && (
          <button
            onClick={clearResults}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Scanner Component */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '20px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        padding: '10px'
      }}>
        <BarcodeScanner
          isActive={isScanning}
          onScan={handleScan}
          onError={handleError}
          onPermissionGranted={handlePermissionGranted}
          onPermissionDenied={handlePermissionDenied}
          width={400}
          height={300}
        />
      </div>

      {/* Instructions */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Instructions:</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>Click "Start Scanner" to begin barcode scanning</li>
          <li>Allow camera permission when prompted</li>
          <li>Point camera at a barcode or QR code</li>
          <li>Scanner supports various formats: QR, UPC, EAN, Code128, etc.</li>
          <li>Use "Switch Camera" button to toggle between front/back cameras</li>
          <li>Scanner will automatically stop after detecting a barcode</li>
        </ul>
      </div>

      {/* Scanned Results */}
      {scannedResults.length > 0 && (
        <div style={{ 
          backgroundColor: '#e9ecef', 
          padding: '15px', 
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Scanned Results:</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {scannedResults.map((scan, index) => (
              <div 
                key={index}
                style={{ 
                  backgroundColor: 'white',
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#495057' }}>
                  Format: {scan.format}
                </div>
                <div style={{ 
                  wordBreak: 'break-all', 
                  marginTop: '4px',
                  fontFamily: 'monospace'
                }}>
                  {scan.text}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6c757d',
                  marginTop: '4px'
                }}>
                  Scanned: {new Date(scan.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Developer Info */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>Development Notes:</strong>
        <ul style={{ marginTop: '8px', marginBottom: 0 }}>
          <li>This scanner uses the ZXing library for barcode detection</li>
          <li>Requires HTTPS in production for camera access</li>
          <li>Supports most common barcode formats</li>
          <li>Optimized for World App MiniApp environment</li>
        </ul>
      </div>
    </div>
  );
} 