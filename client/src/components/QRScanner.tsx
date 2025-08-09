import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScanning = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      setError("Camera access denied or not available");
      console.error("Camera error:", err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  // Mock QR scanning for demo - in real app you'd use a QR code library
  const simulateQRScan = () => {
    onScan("mock-show-id-123");
    stopScanning();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Box sx={{ textAlign: "center" }}>
      {!scanning && (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Scan a QR code to join a karaoke show
          </Typography>
          <Button variant="contained" onClick={startScanning}>
            Start Camera
          </Button>
        </Box>
      )}

      {scanning && (
        <Box>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxWidth: "400px",
              height: "300px",
              objectFit: "cover",
            }}
          />
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={simulateQRScan} sx={{ mr: 1 }}>
              Simulate QR Scan (Demo)
            </Button>
            <Button variant="outlined" onClick={stopScanning}>
              Stop
            </Button>
          </Box>
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default QRScanner;
