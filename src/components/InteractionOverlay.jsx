import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

const InteractionOverlay = ({
  isOpen,
  onClose,
  children,
  editor = null,
  htmlContent = null,
  canvasWidthPct = 80,
  canvasHeightPct = 80,
  cameraProps = { position: [0, 1.8, 3], fov: 50 },
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${canvasWidthPct}%`,
          height: `${canvasHeightPct}%`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {htmlContent ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {htmlContent}
          </div>
        ) : (
          <Canvas
            style={{ width: "100%", height: "100%", background: "transparent" }}
            camera={cameraProps}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.7} />
            {/* default OrbitControls to inspect the overlay model */}
            <OrbitControls />
            {children}
          </Canvas>
        )}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.9)",
            border: "none",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Close
        </button>
        {editor && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              width: "90%",
              zIndex: 101,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {editor}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractionOverlay;
