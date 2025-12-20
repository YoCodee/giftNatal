import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

// Cinematic eye-opening transition overlay used on initial load
// Plays when asset loading finishes (progress >= 100) then animates open with blink effect
const EyeTransition = ({
  minDisplay = 350,
  openDuration = 650,
  blinkCount = 4,
  slowmoFactor = 1.8,
  blurMax = 8,
  blurFadeDuration = 700,
  onFinished, // <-- ADD THIS
}) => {
  const { progress } = useProgress();
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  // blinkStage not used, we keep timeouts only
  const [eyelidDuration, setEyelidDuration] = useState(openDuration);
  const [blurPx, setBlurPx] = useState(0);
  const [blurTransitionMs, setBlurTransitionMs] = useState(200);
  const timeouts = useRef([]);

  useEffect(() => {
    // When loading completes, run the open+blink sequence
    if (progress >= 100 && visible) {
      // ensure minimum display
      const start = setTimeout(() => {
        setOpen(true); // open eyelids
        // after openDuration, do blinks if any
        const blinkStart = setTimeout(() => {
          if (blinkCount > 0) {
            let blinkIndex = 0;
            const blinkLoop = () => {
              const isLast = blinkIndex + 1 === blinkCount;
              // slow motion durations for most blinks
              const closeDur = isLast
                ? Math.round(120)
                : Math.round(220 * slowmoFactor);
              const holdDur = isLast
                ? Math.round(80)
                : Math.round(120 * slowmoFactor);
              const openDur = isLast
                ? Math.round(260)
                : Math.round(220 * slowmoFactor);

              // set eyelid transition to matching close duration
              setEyelidDuration(closeDur);
              // start blur on close
              setBlurPx(blurMax);
              setBlurTransitionMs(isLast ? blurFadeDuration : 120);
              setOpen(false);

              const closeTimeout = setTimeout(() => {
                setEyelidDuration(openDur);
                setOpen(true);
                blinkIndex += 1;
                // after opening, if not last, remove blur quickly; if last, remove smoothly
                const afterOpen = setTimeout(() => {
                  if (isLast) {
                    // fade blur to 0 using blurTransitionMs
                    setBlurTransitionMs(blurFadeDuration);
                    setBlurPx(0);
                    // hide overlay shortly after final smooth fade
                    const hideTimeout = setTimeout(() => {
                      setVisible(false);
                      setShowTutorial(true); // show tutorial overlay after the last blink
                    }, blurFadeDuration + 120);
                    timeouts.current.push(hideTimeout);
                  } else {
                    // quick blur restore
                    setBlurPx(0);
                    const nextTimeout = setTimeout(blinkLoop, 200);
                    timeouts.current.push(nextTimeout);
                  }
                }, holdDur);
                timeouts.current.push(afterOpen);
              }, closeDur);
              timeouts.current.push(closeTimeout);
            };
            blinkLoop();
          } else {
            // no blink — just hide after short delay
            const hideTimeout = setTimeout(() => setVisible(false), 200);
            timeouts.current.push(hideTimeout);
          }
        }, openDuration);
        timeouts.current.push(blinkStart);
      }, minDisplay);
      timeouts.current.push(start);
    }
    return () => {
      timeouts.current.forEach((t) => clearTimeout(t));
      timeouts.current = [];
    };
  }, [
    progress,
    visible,
    blinkCount,
    openDuration,
    minDisplay,
    slowmoFactor,
    blurMax,
    blurFadeDuration,
  ]);

  if (!visible && !showTutorial) return null;

  // styles
  const overlayStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    zIndex: 99999,
    pointerEvents: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  };

  const eyelidCommon = {
    position: "absolute",
    left: 0,
    width: "100%",
    height: "50%",
    background: "#000",
    transition: `transform ${eyelidDuration}ms cubic-bezier(.22,.8,.28,1)`,
    willChange: "transform",
  };

  const topStyle = {
    ...eyelidCommon,
    top: 0,
    transform: open ? "translateY(-100%)" : "translateY(0)",
  };

  const bottomStyle = {
    ...eyelidCommon,
    bottom: 0,
    transform: open ? "translateY(100%)" : "translateY(0)",
  };

  // subtle vignette to enhance cinematic effect
  const vignette = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    background:
      "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.7) 100%)",
    pointerEvents: "none",
  };

  // blur overlay applied across the whole overlay
  const blurStyle = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    transition: `filter ${blurTransitionMs}ms ease, backdrop-filter ${blurTransitionMs}ms ease`,
    filter: `blur(${blurPx}px)`,
    backdropFilter: `blur(${blurPx}px)`,
    WebkitBackdropFilter: `blur(${blurPx}px)`,
  };

  return (
    <div style={overlayStyle} aria-hidden>
      <div style={topStyle} />
      <div style={bottomStyle} />
      <div style={vignette} />
      <div style={blurStyle} />
      {/* Tutorial overlay (shown after all blinks) */}
      {showTutorial && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              width: "min(720px, 92%)",
              background: "rgba(0,0,0,0.55)",
              borderRadius: 8,
              padding: 24,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center",
            }}
          >
            <TutorialContent
              index={tutorialIndex}
              setIndex={setTutorialIndex}
              onExit={() => {
                setShowTutorial(false);
                if (onFinished) onFinished();
                // try to focus the canvas so keyboard input works right away
                requestAnimationFrame(() => {
                  const canvas = document.querySelector("canvas");
                  if (canvas && typeof canvas.focus === "function")
                    canvas.focus();
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EyeTransition;

function TutorialContent({ index, setIndex, onExit }) {
  const steps = [
    {
      key: "wasd",
      img: "/images/WASD.png",
      title: "WASD",
      text: "to walk",
    },
    {
      key: "mouse",
      img: "/images/MOUSE.png",
      title: "MOUSE",
      text: "to view",
    },
  ];

  const step = steps[Math.max(0, Math.min(index, steps.length - 1))];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        setIndex((s) => Math.min(steps.length - 1, s + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((s) => Math.max(0, s - 1));
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIndex, onExit, steps.length]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "34%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={step.img}
            alt={step.title}
            style={{ width: "100%", maxWidth: 220, height: "auto" }}
          />
        </div>
        <div style={{ textAlign: "left", width: "66%" }}>
          <h3 style={{ margin: 0, fontSize: 24 }}>{step.title}</h3>
          <p style={{ margin: "6px 0 0 0" }}>{step.text}</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <div>
          <button
            onClick={() => setIndex(Math.max(0, index - 1))}
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              display: index === 0 ? "none" : "inline-block",
            }}
          >
            Prev
          </button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {index < steps.length - 1 ? (
            <button
              onClick={() => setIndex(index + 1)}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "none",
                padding: "8px 18px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => onExit()}
              style={{
                background: "#fff",
                color: "#000",
                border: "none",
                padding: "8px 18px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
        <p style={{ margin: 0 }}>
          Press WASD to move, drag mouse to look around.
        </p>
      </div>
    </div>
  );
}
