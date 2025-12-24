import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useLocation } from "react-router-dom";
import { useProgress, Html, KeyboardControls, Stats } from "@react-three/drei";
import ChristmasRoom from "../components/Three/ChristmasRoom";
import Sky from "../components/sky/Sky";
import Crosshair from "../components/Crosshair";
import { Physics } from "@react-three/rapier";
import Player from "../components/Three/Player";
import EyeTransition from "../components/EyeTransition";
import { Leva, useControls } from "leva";
import NatalMessageOverlay from "../components/NatalMessageOverlay";
import InteractionOverlay from "../components/InteractionOverlay";
import GiftViewer from "../components/GiftViewer";
import CinematicCamera from "../components/Three/CinematicCamera";
import DialogBox from "../components/DialogBox";
import { Book } from "../components/Three/Book";
import LayoutBook from "../components/ComponenBook/LayoutBook.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="bg-red-900/90 text-white p-8 rounded-xl max-w-lg border border-red-500 backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-4">Terjadi Kesalahan!</h2>
            <p className="mb-2">
              Gagal memuat aset 3D. Kemungkinan file terlalu besar atau korup.
            </p>
            <pre className="bg-black/50 p-4 rounded text-xs overflow-auto max-h-40">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-white text-red-900 px-4 py-2 rounded font-bold hover:bg-gray-200"
            >
              Coba Lagi
            </button>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["Shift"] },
  { name: "jump", keys: ["Space"] },
  { name: "interact", keys: ["KeyE"] },
  { name: "respawn", keys: ["KeyR"] },
];

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="relative flex flex-col items-center justify-center p-10 rounded-3xl overflow-hidden min-w-[320px] shadow-[0_0_50px_rgba(220,38,38,0.3)]">
        {/* Card Background with Blur and Gradient Border */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-transparent to-green-900/30 pointer-events-none rounded-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Spinning/Bouncing Icon */}
          <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="text-8xl animate-[bounce_2s_infinite] filter drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
              🎄
            </div>
          </div>

          <h2 className="text-2xl font-serif font-bold text-white mb-1 tracking-wide text-center drop-shadow-md">
            Memuat Keajaiban...
          </h2>
          <p className="text-xs text-yellow-500/80 mb-6 uppercase tracking-[0.2em]">
            Please Wait
          </p>

          {/* Progress Container */}
          <div className="w-64 bg-gray-900/80 rounded-full h-4 mb-2 p-1 border border-white/10 overflow-hidden relative shadow-inner">
            {/* Progress Fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 relative transition-all duration-300 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
              style={{ width: `${progress}%` }}
            >
              {/* Candy Cane Stripes Overlay */}
              <div className="absolute inset-0 w-full h-full opacity-40 bg-[length:10px_10px] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.5)_5px,rgba(255,255,255,0.5)_10px)]" />
            </div>
          </div>

          <div className="flex justify-between w-64 text-xs font-semibold px-2 mt-1">
            <span className="text-gray-500">Menyiapkan Kado...</span>
            <span className="text-green-400">{progress.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </Html>
  );
};

const Main = () => {
  const { state } = useLocation();
  const userName = state?.name || "Yohanes";
  const characterRef = useRef();
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const cinematicAudioRef = useRef(null);

  const [crosshairMode, setCrosshairMode] = React.useState("dot");
  const [interactableName, setInteractableName] = React.useState(null);
  const [interactables, setInteractables] = React.useState([]);
  const [interactablesMeta, setInteractablesMeta] = React.useState({});
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [overlay3DOpen, setOverlay3DOpen] = React.useState(false);
  const [overlay3DModelUrl, setOverlay3DModelUrl] = useState(null);
  const [object3DToInspect, setObject3DToInspect] = useState(null);
  const [cinematicMode, setCinematicMode] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [questStep, setQuestStep] = useState(0);
  // 0: Intro
  // 1: Find Message
  // 2: Dialog Post-Message
  // 3: Find Gift
  // 4: Dialog Post-Gift
  // 5: Cinematic Unlocked

  const [currentDialogData, setCurrentDialogData] = useState([]);
  const [showBookOverlay, setShowBookOverlay] = useState(false);
  const [canExitCinematic, setCanExitCinematic] = useState(false);

  // Dialog Scripts
  const dialogContent = {
    intro: [
      {
        name: "Santa",
        text: `Hohoho! Selamat datang ${userName}! Aku sangat senang kau ada di sini.`,
        image: "/images/Santaa.png",
      },
      {
        name: "Santa",
        text: "Aku punya hadiah spesial untukmu. Tapi sebelum itu, aku meninggalkan sebuah pesan penting.",
        image: "/images/Santaa.png",
      },
      {
        name: "Santa",
        text: "Coba temukan amplop surat yang ada di atas meja. Bacalah isinya dulu ya!",
        image: "/images/Santaa.png",
      },
    ],
    wrongObject: [
      {
        name: "Santa",
        text: "Eits! Jangan buka kado itu dulu. Cari surat pesannya dulu, oke? Hohoho!",
        image: "/images/Santaa.png",
      },
    ],
    afterMessage: [
      {
        name: "Santa",
        text: "Indah sekali bukan? Kamu telah melakukan hal-hal hebat tahun ini.",
        image: "/images/Santaa.png",
      },
      {
        name: "Santa",
        text: "Sekarang, kamu boleh membuka hadiah utamamu. Carilah kado warna biru di Meja!",
        image: "/images/Santaa.png",
      },
    ],
    lockedCinematic: [
      {
        name: "Santa",
        text: "Sabar ya! Nikmati pestanya satu per satu. Selesaikan dulu misi sebelumnya!",
        image: "/images/Santaa.png",
      },
    ],
    afterGift: [
      {
        name: "Santa",
        text: "Bagaimana hadiahnya? Semoga kamu menyukainya!",
        image: "/images/Santaa.png",
      },
      {
        name: "Santa",
        text: "Sebagai penutup yang manis, aku ingin menunjukkan sesuatu yang indah.",
        image: "/images/Santaa.png",
      },
      {
        name: "Santa",
        text: "Pergilah ke Jendela Ruangan untuk melihat momen Cinematic spesial!",
        image: "/images/Santaa.png",
      },
    ],
  };

  // When overlay is shown, we will render a simpleDOM overlay with text
  React.useEffect(() => {
    if (overlayOpen) {
      if (document?.pointerLockElement) document.exitPointerLock();
    }
  }, [overlayOpen]);

  React.useEffect(() => {
    if (overlay3DOpen) {
      if (document?.pointerLockElement) document.exitPointerLock();
    }
  }, [overlay3DOpen]);

  // When cinematic mode is active, exit pointer lock so user can use the mouse
  // When cinematic mode is active, exit pointer lock so user can use the mouse
  React.useEffect(() => {
    if (cinematicMode) {
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [cinematicMode]);

  // Handle F key for cinematic mode
  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (overlayOpen && e.key === "Escape") {
        setOverlayOpen(false);
        if (canvasRef?.current?.requestPointerLock)
          canvasRef.current.requestPointerLock();
      }

      const isLookingAtTrigger =
        interactableName && interactableName.toLowerCase().includes("asiap");

      if (
        isLookingAtTrigger &&
        !cinematicMode &&
        (e.code === "KeyF" || e.key.toLowerCase() === "f")
      ) {
        // Validation: Must be at least step 5 to enter cinematic
        if (questStep < 5) {
          setCurrentDialogData(dialogContent.lockedCinematic);
          setShowDialog(true);
        } else {
          setCinematicMode(true);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    interactableName,
    cinematicMode,
    overlayOpen,
    questStep,
    dialogContent.lockedCinematic,
  ]);

  // LEVA controls for the viewer overlay
  const {
    viewerTargetSize,
    viewerPadding,
    viewerFov,
    overlayCanvasWidthPct,
    overlayCanvasHeightPct,
    selectedMap,
  } = useControls("Settings", {
    viewerTargetSize: {
      value: 5,
      min: 0.1,
      max: 5,
      step: 0.05,
      folder: "3D Overlay",
    },
    viewerPadding: {
      value: 10,
      min: 0,
      max: 10,
      step: 0.05,
      folder: "3D Overlay",
    },
    viewerFov: { value: 120, min: 10, max: 120, step: 1, folder: "3D Overlay" },
    overlayCanvasWidthPct: {
      value: 100,
      min: 20,
      max: 100,
      step: 1,
      folder: "3D Overlay",
    },
    overlayCanvasHeightPct: {
      value: 100,
      min: 20,
      max: 100,
      step: 1,
      folder: "3D Overlay",
    },
    selectedMap: {
      options: {
        "Christmas Room": "/models/Lekkuterakhir1.glb",
      },
      value: "/models/Lekkuterakhir1.glb",
      label: "Map Selection",
    },
  });

  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);

  React.useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume;
    }
    if (cinematicAudioRef.current) {
      cinematicAudioRef.current.volume = effectiveVolume;
    }
  }, [volume, isMuted]);

  React.useEffect(() => {
    if (cinematicMode) {
      audioRef.current?.pause();
      if (cinematicAudioRef.current) {
        cinematicAudioRef.current.currentTime = 0;
        cinematicAudioRef.current.play();
      }
    } else {
      cinematicAudioRef.current?.pause();
      audioRef.current?.play();
    }
  }, [cinematicMode]);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const isMob =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 1024;
      setIsMobile(isMob);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Objective System
  const getObjective = (step) => {
    switch (step) {
      case 0:
        return "Dengarkan Santa";
      case 1:
        return "Cari Surat di Meja ✉️";
      case 2:
        return "Kembali Bicara dengan Santa";
      case 3:
        return "Buka Kado Biru di Meja 🎁";
      case 4:
        return "Selesaikan Dialog";
      case 5:
        return "Cari Jendela & Masuk Cinematic Mode 🎥";
      default:
        return "Nikmati Suasana Natal";
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="text-6xl mb-4">🎄</div>
        <h1 className="text-3xl font-serif font-bold text-red-500 mb-4">
          Maaf, Belum Tersedia
        </h1>
        <p className="text-gray-300 max-w-md leading-relaxed">
          Pengalaman Web 3D ini membutuhkan keyboard dan mouse serta layar yang
          lebih besar untuk pengalaman terbaik.
        </p>
        <p className="mt-4 text-yellow-500 font-bold">
          Silakan buka kembali di Laptop atau PC Desktop.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black ">
      <Crosshair
        initial="dot"
        pointerLockOnly={false}
        canvasRef={canvasRef}
        onModeChange={setCrosshairMode}
      />

      {cinematicMode && canExitCinematic && (
        <button
          onClick={() => setCinematicMode(false)}
          className="fixed top-20 right-6 bg-red-500/80 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm z-50 transition-colors font-bold shadow-lg animate-in fade-in duration-500"
        >
          ✕
        </button>
      )}

      {/* Volume Control */}
      {!overlayOpen && !overlay3DOpen && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 pl-4 pr-3 rounded-full border border-white/10 hover:bg-black/60 transition-colors group animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-out flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-green-400 hover:accent-green-300"
            />
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/80 hover:text-white transition-colors p-1"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            ) : volume < 0.5 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            )}
          </button>
        </div>
      )}

      <div
        className={`fixed top-0 left-0 w-full bg-black z-40 transition-all duration-1000 ease-in-out pointer-events-none ${
          cinematicMode ? "h-[10vh]" : "h-0"
        }`}
      />
      <div
        className={`fixed bottom-0 left-0 w-full bg-black z-40 transition-all duration-1000 ease-in-out pointer-events-none ${
          cinematicMode ? "h-[10vh]" : "h-0"
        }`}
      />

      {/* Cinematic Flash Transition */}

      {/* Controls Guide */}
      {!cinematicMode && !overlayOpen && !overlay3DOpen && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-none animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-lg flex flex-col items-end gap-1 text-[10px] sm:text-xs font-mono text-gray-300">
            <div className="flex items-center gap-2">
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">
                ESC
              </span>
              <span>Show Cursor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">
                CLICK
              </span>
              <span>Lock View</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">
                WASD
              </span>
              <span>Move</span>
            </div>
          </div>
        </div>
      )}

      {/* Objective Tracker */}
      {!cinematicMode && !overlayOpen && !overlay3DOpen && !showDialog && (
        <div className="fixed top-6 left-6 z-30 pointer-events-none animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl">
            <h3 className="text-yellow-500/80 text-xs uppercase tracking-widest font-bold mb-1">
              Current Mission
            </h3>
            <div className="text-white font-serif text-lg flex items-center gap-2">
              <span className="animate-pulse text-red-500">➤</span>
              {getObjective(questStep)}
            </div>
          </div>
        </div>
      )}

      <EyeTransition
        minDisplay={400}
        openDuration={1000}
        blinkCount={4}
        slowmoFactor={1.8}
        blurMax={8}
        blurFadeDuration={700}
        onFinished={() => {
          setCurrentDialogData(dialogContent.intro);
          setShowDialog(true);
        }}
      />

      <DialogBox
        isOpen={showDialog}
        dialogData={currentDialogData}
        onComplete={() => {
          setShowDialog(false);
          if (questStep === 0) {
            setQuestStep(1);
          } else if (questStep === 2) {
            setQuestStep(3);
          } else if (questStep === 4) {
            setQuestStep(5);
          }
        }}
      />

      <KeyboardControls map={keyboardMap}>
        <Leva collapsed={false} hidden={true} />
        <Canvas
          ref={canvasRef}
          camera={{
            position: [0, 5, 10],
            fov: window.innerWidth < 768 ? 65 : 50,
          }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.36} color="#402617" />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.5}
            color="#ffd4a3"
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
          />

          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Sky />

              {cinematicMode && (
                <CinematicCamera
                  userName={userName}
                  onShowBook={() => {
                    setCinematicMode(false); // Opsional: Matikan cinematic mode kalau mau fokus ke overlay
                    setShowBookOverlay(true);
                  }}
                  onCanExit={setCanExitCinematic}
                />
              )}

              <Physics gravity={[0, -9.81, 0]}>
                <ChristmasRoom
                  modelPath={selectedMap}
                  onInteractablesReady={(arr, meta) => {
                    setInteractables(arr);
                    setInteractablesMeta(meta || {});
                  }}
                />
                <Player
                  ref={characterRef}
                  canvasRef={canvasRef}
                  crosshairMode={crosshairMode}
                  interactables={interactables}
                  onInteractableChange={(name) => setInteractableName(name)}
                  onInteract={(name) => {
                    setInteractableName(null);
                    if (name === "Object_6") {
                      // Check logic for Gift
                      if (questStep < 3) {
                        setCurrentDialogData(dialogContent.wrongObject);
                        setShowDialog(true);
                        return;
                      }

                      const found = interactables?.find(
                        (o) => o?.name === name
                      );
                      const meta = found ? interactablesMeta[found.uuid] : null;
                      if (meta && meta.clips && meta.clips.length > 0) {
                        try {
                          const clone = found.clone(true);
                          clone.position.set(0, 0, 0);
                          clone.rotation.set(0, 0, 0);
                          clone.scale.set(1, 1, 1);
                          setObject3DToInspect(clone);
                          setOverlay3DOpen(true);
                        } catch {
                          setOverlay3DModelUrl("/models/kadoWAnim4.glb");
                          setOverlay3DOpen(true);
                        }
                      } else {
                        setOverlay3DModelUrl("/models/kadoWAnim4.glb");
                        setOverlay3DOpen(true);
                      }
                    } else {
                      // Message Logic
                      setShowBookOverlay(true);
                    }
                  }}
                  disabled={
                    overlayOpen ||
                    overlay3DOpen ||
                    cinematicMode ||
                    showDialog ||
                    showBookOverlay
                  }
                />
              </Physics>
            </Suspense>
          </ErrorBoundary>

        </Canvas>
      </KeyboardControls>

      {interactableName &&
        !interactableName.toLowerCase().includes("asiap") &&
        !cinematicMode && (
          <div
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#fff",
              padding: "8px 16px",
              background: "rgba(0,0,0,0.45)",
              borderRadius: 6,
              zIndex: 8000,
              pointerEvents: "none",
            }}
          >
            Press <b>E</b> to interact
          </div>
        )}

      {interactableName &&
        interactableName.toLowerCase().includes("asiap") &&
        !cinematicMode && (
          <div
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#fff",
              padding: "8px 16px",
              background: "rgba(0,0,0,1)",
              borderRadius: 6,
              zIndex: 8000,
              pointerEvents: "none",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Press <b>F</b> for Cinematic Mode
          </div>
        )}
      <NatalMessageOverlay
        isOpen={overlayOpen}
        onClose={() => {
          setOverlayOpen(false);
          if (canvasRef?.current?.requestPointerLock)
            canvasRef.current.requestPointerLock();

          if (questStep === 1) {
            setQuestStep(2); // Mark message as read, setup for next dialog
            setCurrentDialogData(dialogContent.afterMessage);
            setShowDialog(true);
          }
        }}
        recipient={userName}
        pages={[
          // Page 1: Intro & Recognition
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-serif font-bold text-red-700 mb-4 border-b-2 border-green-600 pb-2 inline-block">
              Selamat Hari Natal!
            </h1>
            <div className="text-xl text-gray-800 leading-relaxed font-medium">
              <p className="mb-4">
                Halo{" "}
                <span className="font-bold text-green-700 text-2xl">
                  {userName}
                </span>
                ,
              </p>
              <p>Mari kita ambil waktu sejenak untuk mengakui satu hal:</p>
              <div className="my-6 p-6 bg-green-50 border-2 border-green-200 rounded-xl shadow-inner transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <p className="font-bold text-2xl text-green-800 tracking-wide">
                  "Anda telah melewati tahun 2025 dengan luar biasa!"
                </p>
              </div>
            </div>
          </div>,

          // Page 2: Reflection & Validation
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <div className="flex items-start gap-4">
              <span className="text-4xl">🏔️</span>
              <p>
                Lihatlah kembali semua yang telah Anda capai—semua tantangan
                yang Anda taklukkan, semua rintangan yang Anda ubah menjadi batu
                loncatan.
              </p>
            </div>
            <p className="pl-14">
              Itu semua adalah bukti dari{" "}
              <span className="font-bold text-red-600">
                kekuatan, ketahanan, dan semangat luar biasa
              </span>{" "}
              yang ada di dalam diri Anda.
            </p>
            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400 italic text-gray-600 shadow-sm mt-4">
              "Anda benar-benar game changer tahun ini!"
            </div>
          </div>,

          // Page 3: Motivation & Closing
          <div className="flex flex-col h-full justify-center space-y-6 text-lg text-gray-700">
            <p>
              Semangat Natal ini adalah momentum sempurna untuk mengisi ulang
              energi. Biarkan kehangatan dan cahaya perayaan ini membangkitkan
              tekad Anda.
            </p>
            <p>
              Ingatlah, potensi Anda tidak terbatas. Apa yang sudah Anda lakukan
              di 2025 hanyalah{" "}
              <span className="font-bold text-red-600 text-xl border-b-2 border-red-400">
                Permulaan
              </span>
              .
            </p>
            <div className="mt-auto pt-8 text-center bg-gradient-to-r from-red-600 to-red-700 text-white py-6 rounded-xl shadow-lg transform rotate-1 hover:scale-105 transition-all duration-300">
              <p className="font-serif text-2xl font-bold">
                Selamat Natal & Tahun Baru!
              </p>
              <p className="text-sm text-red-100 mt-2 font-medium tracking-wider uppercase">
                Sambut masa depan penuh kemenangan
              </p>
            </div>
          </div>,
        ]}
      />
      <InteractionOverlay
        isOpen={overlay3DOpen}
        onClose={() => {
          setOverlay3DOpen(false);
          setOverlay3DModelUrl(null);
          setObject3DToInspect(null);
          if (canvasRef?.current?.requestPointerLock)
            canvasRef.current.requestPointerLock();

          // If we just closed the gift (step 3), move to next step
          if (questStep === 3) {
            setQuestStep(4);
            setCurrentDialogData(dialogContent.afterGift);
            setShowDialog(true);
          }
        }}
        canvasWidthPct={overlayCanvasWidthPct}
        canvasHeightPct={overlayCanvasHeightPct}
        cameraProps={{ position: [0, 1.8, 6], fov: viewerFov }}
      >
        {object3DToInspect ? (
          <ClonedViewer
            object3D={object3DToInspect}
            clips={interactablesMeta?.[object3DToInspect?.uuid]?.clips}
          />
        ) : (
          overlay3DModelUrl && (
            <GiftViewer
              url={overlay3DModelUrl}
              target={viewerTargetSize}
              cameraPadding={viewerPadding}
              cameraFov={viewerFov}
            />
          )
        )}
      </InteractionOverlay>

      {/* Book Overlay - Full Screen LayoutBook */}
      {showBookOverlay && (
        <div className="fixed inset-0 z-[10000] bg-[radial-gradient(circle_at_center,_#FFD700_0%,_#DAA520_20%,_#2C1503_80%)] animate-in fade-in duration-700">
          <button
            onClick={() => {
              setShowBookOverlay(false);
              if (canvasRef?.current?.requestPointerLock)
                canvasRef.current.requestPointerLock();

              if (questStep === 1) {
                setQuestStep(2); // Mark message as read, setup for next dialog
                setCurrentDialogData(dialogContent.afterMessage);
                setShowDialog(true);
              }
            }}
            className="absolute top-6 right-6 z-[10001] bg-white/20 hover:bg-white/40 text-white p-3 px-6 rounded-full backdrop-blur-md transition-all duration-300 font-bold shadow-2xl border border-white/20 hover:scale-105"
          >
            ✕ Close Book
          </button>
          <LayoutBook />
        </div>
      )}
      <audio ref={audioRef} src="/music/bg_natal.mp3" autoPlay loop />
      <audio ref={cinematicAudioRef} src="/music/cinematic_bgm.mp3" loop />
    </div>
  );
};

export default Main;
