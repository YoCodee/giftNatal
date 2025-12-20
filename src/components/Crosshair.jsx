import React, { useEffect, useState } from "react";

// Crosshair overlay with optional pointer-lock restriction.
// Props:
// - initial: 'dot'|'cross'|'hidden'
// - pointerLockOnly: boolean (if true, only react when pointer is locked)
// - canvasRef: optional ref to the canvas element to validate pointer lock
const Crosshair = ({
  initial = "dot",
  pointerLockOnly = true,
  canvasRef = null,
  onModeChange = null,
}) => {
  const [mode, setMode] = useState(initial); // 'dot' or 'cross' or 'hidden'
  const [active, setActive] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (e.button !== 0) return; // only left click
      if (pointerLockOnly) {
        // only toggle when pointer lock is on and (optionally) locked to our canvas
        const locked = document.pointerLockElement;
        if (!locked) return;
        if (canvasRef?.current && locked !== canvasRef.current) return;
      } else {
        // if a canvasRef is provided, only toggle when the click is within canvas
        if (canvasRef?.current && !canvasRef.current.contains(e.target)) return;
      }
      // if hidden -> show dot, else cycle between dot and cross
      const next = (m) =>
        m === "hidden" ? "dot" : m === "dot" ? "cross" : "dot";
      setMode((m) => {
        const newMode = next(m);
        onModeChange?.(newMode);
        // If switched to dot mode, request pointer lock (user gesture) to allow infinite look
        if (
          newMode === "dot" &&
          canvasRef?.current &&
          canvasRef.current.requestPointerLock
        ) {
          if (canvasRef.current.requestPointerLock)
            canvasRef.current.requestPointerLock();
        }
        return newMode;
      });
      setActive(true);
      window.setTimeout(() => setActive(false), 120);
    };

    window.addEventListener("pointerdown", onPointerDown);
    // right-click to enter dot-only mode
    const onRightClick = (e) => {
      if (e.button !== 2) return;
      e.preventDefault();
      setMode(() => {
        onModeChange?.("dot");
        if (canvasRef?.current && canvasRef.current.requestPointerLock)
          canvasRef.current.requestPointerLock();
        return "dot";
      });
    };
    window.addEventListener("pointerdown", onRightClick);
    const onContextMenu = (e) => {
      if (canvasRef?.current && canvasRef.current.contains(e.target)) {
        e.preventDefault();
      }
    };
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerdown", onRightClick);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [canvasRef, pointerLockOnly, onModeChange]);

  // hide the canvas cursor when in dot mode
  useEffect(() => {
    if (!canvasRef?.current) return;
    const el = canvasRef.current;
    el.style.cursor = mode === "dot" ? "none" : "auto";
    return () => {
      el.style.cursor = "auto";
    };
  }, [mode, canvasRef]);

  // pointer lock state watcher: show/hide when pointer lock changes
  useEffect(() => {
    const onLockChange = () => {
      const lockedEl = document.pointerLockElement;
      if (!pointerLockOnly) {
        setLocked(true);
        return;
      }
      if (!canvasRef?.current) {
        setLocked(Boolean(lockedEl));
      } else {
        setLocked(lockedEl === canvasRef.current);
      }
    };
    document.addEventListener("pointerlockchange", onLockChange);
    onLockChange();
    return () =>
      document.removeEventListener("pointerlockchange", onLockChange);
  }, [canvasRef, pointerLockOnly]);

  // handle ESC to hide crosshair and release pointer lock
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setMode("hidden");
        if (document.pointerLockElement) document.exitPointerLock();
        // restore cursor
        if (canvasRef?.current) canvasRef.current.style.cursor = "auto";
        onModeChange?.("hidden");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canvasRef, onModeChange]);

  const baseStyle = {
    position: "fixed",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (mode === "hidden") return null;
  if (pointerLockOnly && !locked) return null;

  return (
    <div style={baseStyle} aria-hidden>
      {mode === "dot" ? (
        <div
          style={{
            width: active ? 14 : 8,
            height: active ? 14 : 8,
            borderRadius: 9999,
            background: "#fff",
            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
            transition: "width 0.08s, height 0.08s",
            opacity: 0.95,
          }}
        />
      ) : (
        <svg
          width={active ? 28 : 20}
          height={active ? 28 : 20}
          viewBox="0 0 24 24"
          fill="none"
          style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.6))" }}
        >
          <path
            d="M12 2v4"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M12 22v-4"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M2 12h4"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M22 12h-4"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        
      )}
    </div>
  );
};

export default Crosshair;
