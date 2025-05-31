'use client';

import React, { useState } from 'react';
import BarcodeScanner from '@/components/BarcodeScanner';

export default function TestScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResults, setScannedResults] = useState<Array<{text: string, format: string, timestamp: number}>>([]);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [scanningStatus, setScanningStatus] = useState<string>('Ready to scan');
  const [totalScans, setTotalScans] = useState(0);

  const handleScan = (result: string, format: string) => {
    console.log('🎯 Barcode detected!', { result, format });
    
    const newScan = {
      text: result,
      format: format,
      timestamp: Date.now()
    };
    
    // Update states
    setScannedResults(prev => [newScan, ...prev.slice(0, 9)]); // Keep last 10 results
    setLastScanTime(new Date().toLocaleTimeString());
    setTotalScans(prev => prev + 1);
    setScanningStatus(`✅ DETECTED: ${format} - ${result.substring(0, 20)}...`);
    
    // Show alert for immediate feedback
    alert(`🎯 Barcode Detected!\nFormat: ${format}\nContent: ${result}`);
    
    // Auto-stop scanning after successful scan for testing
    setTimeout(() => {
      setIsScanning(false);
      setScanningStatus('Scan completed - ready for next scan');
    }, 3000);
  };

  const handleError = (error: string) => {
    console.error('Scanner error:', error);
    setScanningStatus(`❌ Error: ${error}`);
    alert(`Scanner Error: ${error}`);
  };

  const handlePermissionGranted = () => {
    console.log('✅ Camera permission granted');
    setScanningStatus('📷 Camera ready - point at a barcode');
  };

  const handlePermissionDenied = () => {
    console.error('❌ Camera permission denied');
    setScanningStatus('❌ Camera access denied');
    alert('Camera permission is required for barcode scanning');
  };

  const clearResults = () => {
    setScannedResults([]);
    setTotalScans(0);
    setLastScanTime(null);
    setScanningStatus('Results cleared - ready to scan');
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanningStatus('🔍 Starting scanner...');
  };

  const stopScanning = () => {
    setIsScanning(false);
    setScanningStatus('⏹️ Scanner stopped');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        📱 Barcode Scanner Test
      </h1>

      {/* Real-time Status Display */}
      <div style={{ 
        backgroundColor: isScanning ? '#d4edda' : '#f8f9fa',
        border: `2px solid ${isScanning ? '#28a745' : '#ddd'}`,
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          Scanner Status: {isScanning ? '🟢 ACTIVE' : '🔴 INACTIVE'}
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {scanningStatus}
        </div>
        {lastScanTime && (
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            Last scan: {lastScanTime} | Total scans: {totalScans}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={isScanning ? stopScanning : startScanning}
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
          {isScanning ? '⏹️ Stop Scanner' : '▶️ Start Scanner'}
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
            🗑️ Clear Results
          </button>
        )}
      </div>

      {/* Scanner Component */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '20px',
        border: `3px solid ${isScanning ? '#28a745' : '#ddd'}`,
        borderRadius: '8px',
        padding: '10px',
        backgroundColor: isScanning ? '#f8fff9' : '#f8f9fa'
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

      {/* Quick Test Section */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>🧪 Quick Test Guide:</h3>
        <ul style={{ marginBottom: 10 }}>
          <li><strong>Step 1:</strong> Click "▶️ Start Scanner" above</li>
          <li><strong>Step 2:</strong> Allow camera permission if prompted</li>
          <li><strong>Step 3:</strong> Point camera at any barcode or QR code</li>
          <li><strong>Expected:</strong> You should see an alert popup + results below</li>
          <li><strong>No barcode?</strong> Try searching "QR code generator" and create one online</li>
        </ul>
        
        <div style={{ 
          backgroundColor: '#d1ecf1', 
          padding: '10px', 
          borderRadius: '6px',
          marginTop: '15px'
        }}>
          <h4 style={{ marginTop: 0, color: '#0c5460' }}>📱 Tips for Linear Barcodes (UPC/EAN/Code128):</h4>
          <ul style={{ marginBottom: 0, fontSize: '14px' }}>
            <li><strong>Hold steady:</strong> Keep barcode centered in green frame</li>
            <li><strong>Proper distance:</strong> 6-12 inches from camera works best</li>
            <li><strong>Good lighting:</strong> Avoid shadows on the barcode</li>
            <li><strong>Horizontal alignment:</strong> Keep barcode lines vertical</li>
            <li><strong>Try both orientations:</strong> Portrait and landscape mode</li>
            <li><strong>QR codes are easier:</strong> They work from any angle! ✅</li>
          </ul>
        </div>
      </div>

      {/* Scanned Results - Now more prominent */}
      {scannedResults.length > 0 ? (
        <div style={{ 
          backgroundColor: '#d1ecf1', 
          border: '2px solid #17a2b8',
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#0c5460' }}>
            🎯 Scan Results ({scannedResults.length} detected)
          </h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {scannedResults.map((scan, index) => (
              <div 
                key={index}
                style={{ 
                  backgroundColor: 'white',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  border: '1px solid #bee5eb',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ 
                  fontSize: '16px',
                  fontWeight: 'bold', 
                  color: '#155724',
                  marginBottom: '8px'
                }}>
                  📊 Format: {scan.format}
                </div>
                <div style={{ 
                  fontSize: '14px',
                  wordBreak: 'break-all', 
                  marginBottom: '8px',
                  fontFamily: 'monospace',
                  backgroundColor: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '4px'
                }}>
                  <strong>Content:</strong> {scan.text}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6c757d'
                }}>
                  ⏰ Detected: {new Date(scan.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '2px dashed #ddd',
          padding: '40px', 
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#666', marginBottom: '10px' }}>
            📭 No barcodes detected yet
          </h3>
          <p style={{ color: '#888', margin: 0 }}>
            Start the scanner and point it at a barcode or QR code to see results here
          </p>
        </div>
      )}

      {/* Debug Console */}
      <div style={{ 
        backgroundColor: '#2d3748', 
        color: '#e2e8f0',
        padding: '15px', 
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>🔧 Debug Console:</strong><br/>
        • Check browser console (F12) for additional debug messages<br/>
        • Scanner uses ZXing library with 100ms scan intervals<br/>
        • Results will appear in alerts AND in the results section<br/>
        • Current state: {isScanning ? 'SCANNING' : 'STOPPED'}<br/>
      </div>
    </div>
  );
} 