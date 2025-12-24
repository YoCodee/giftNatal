import { useFrame } from "@react-three/fiber";
import { useControls, button, folder } from "leva";
import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";

import { Book } from "./Book";

const CinematicCamera = ({
  onFinaleFinished,
  onShowBook,
  userName,
  onCanExit,
}) => {
  const [currentShot, setCurrentShot] = useState(0);
  const shotStartTime = useRef(null);

  const [showFinale, setShowFinale] = useState(false);
  const [showSecondFinale, setShowSecondFinale] = useState(false);

  // Credits State
  const [creditStep, setCreditStep] = useState(0);
  const [showBook, setShowBook] = useState(false);

  const credit2Opacity = useRef(0);
  const credit3Opacity = useRef(0);
  const credit4Opacity = useRef(0);

  const textOpacity = useRef(0);
  const secondTextOpacity = useRef(0);

  const stepsTimerRef = useRef([]);

  // Refs for direct manipulation
  const textRef = useRef();
  const textMatRef = useRef();
  const text2Ref = useRef();
  const text2MatRef = useRef();

  const credContactRef = useRef();
  const credContactMatRef = useRef();
  const credThanksRef = useRef();
  const credThanksMatRef = useRef();
  const credPrayRef = useRef();
  const credPrayMatRef = useRef();

  // Trigger sequences
  useEffect(() => {
    const addTimer = (fn, delay) => {
      const id = setTimeout(fn, delay);
      stepsTimerRef.current.push(id);
      return id;
    };

    if (showFinale) {
      // Clear prev timers
      stepsTimerRef.current.forEach(clearTimeout);
      stepsTimerRef.current = [];

      // SEQUENCE START
      // T=0 is when showFinale becomes true (Text 1: Is You) shows up based on opacity logic below

      // 1. Start Credits Sequence after a delay (IS YOU - 10 Seconds)
      // Step 2: Contact (Formerly Step 2, now taking slot 1 at 10s)
      addTimer(() => {
        setCreditStep(2); // Contact
        if (onCanExit) onCanExit(true); // Allow exit during credits
      }, 10000);

      // Step 3: Thanks (Shifted)
      addTimer(() => setCreditStep(3), 16000);

      // Step 4: #Lekas Pulih (Shifted)
      addTimer(() => setCreditStep(4), 22000);

      // Step 5: Greeting (ShowSecondFinale)
      addTimer(() => {
        setCreditStep(0); // Hide credits
        setShowSecondFinale(true);
      }, 28000);

      // End
      addTimer(() => {
        // setShowSecondFinale(false);
      }, 41000);

      addTimer(() => {
        if (onFinaleFinished) onFinaleFinished();
      }, 61000);
    } else {
      setShowSecondFinale(false);
      setCreditStep(0);
      setShowBook(false);
      if (onCanExit) onCanExit(false);
    }

    return () => {
      stepsTimerRef.current.forEach(clearTimeout);
    };
  }, [showFinale, onFinaleFinished]);

  // Define controls for sequence and shots
  const values = useControls("Cinematic Sequence", {
    General: folder({
      playbackMode: {
        options: ["Sequence", "Loop Shot", "Manual Scrub"],
        value: "Sequence",
        label: "Playback Mode",
      },
      selectedShot: {
        value: 1,
        min: 1,
        max: 5,
        step: 1,
        label: "Selected Shot #",
        hint: "For Loop/Manual modes",
      },
      scrub: {
        value: 0,
        min: 0,
        max: 1,
        label: "Scrub Progress",
        hint: "Only works in Manual Scrub mode",
      },
      "Reset Sequence": button(() => {
        // eslint-disable-next-line react-hooks/refs
        setCurrentShot(0);
        // eslint-disable-next-line react-hooks/refs
        shotStartTime.current = null;
      }),
    }),
    "Shot 1": folder({
      s1_start: { value: [-1.6, 3.5, 4.6], step: 0.1, label: "Start" },
      s1_end: { value: [-1.6, 1.5, 1], step: 0.1, label: "End" },
      s1_target: { value: [4, 0, 0], step: 0.1, label: "LookAt" },
      s1_duration: {
        value: 16.2,
        min: 1,
        max: 30,
        step: 0.5,
        label: "Duration",
      },
    }),
    "Shot 2": folder({
      s2_start: { value: [4, 2, 0], step: 0.1, label: "Start" },
      s2_end: { value: [0, 2, 5], step: 0.1, label: "End" },
      s2_target: { value: [0, 1, 0], step: 0.1, label: "LookAt" },
      s2_duration: {
        value: 11.5,
        min: 1,
        max: 30,
        step: 0.5,
        label: "Duration",
      },
    }),
    "Shot 3": folder({
      s3_start: { value: [-3, -2, 0], step: 0.1, label: "Start" },
      s3_end: { value: [-1, 3, 1], step: 0.1, label: "End" },
      s3_target: { value: [0, -20.4, 0], step: 0.1, label: "LookAt" },
      s3_duration: { value: 9, min: 1, max: 30, step: 0.5, label: "Duration" },
    }),
    "Shot 4": folder({
      s4_start: { value: [6, 1.5, 4], step: 0.1, label: "Start" },
      s4_end: { value: [2, 1, 2], step: 0.1, label: "End" },
      s4_target: { value: [-140, -13.5, 10.5], step: 0.1, label: "LookAt" },
      s4_duration: {
        value: 6.2,
        min: 1,
        max: 30,
        step: 0.5,
        label: "Duration",
      },
    }),
    "Shot 5": folder({
      s5_start: { value: [-3.1, 1.0, 1], step: 0.1, label: "Start" },
      s5_end: { value: [15, 2, 8], step: 0.1, label: "End" },
      s5_target: { value: [35.1, 0, 11.1], step: 0.1, label: "LookAt" },
      s5_duration: {
        value: 5.5,
        min: 1,
        max: 30,
        step: 0.5,
        label: "Duration",
      },
    }),
    "Finale Text": folder({
      textPosition: { value: [35.1, 0, 11.1], step: 0.1, label: "Position" },
      textContent: { value: "Is Youuu", label: "Content" },
      textFontSize: { value: 2.5, min: 0.1, max: 10, step: 0.1, label: "Size" },
      textColor: { value: "#fbbf24", label: "Color" },
      textFont: {
        options: {
          "Dancing Script": "/fonts/DancingScript-VariableFont_wght.ttf",
        },
        value: "/fonts/DancingScript-VariableFont_wght.ttf",
        label: "Font",
      },
    }),
    "Finale Text 2": folder({
      text2Position: { value: [35.1, 0, 11.1], step: 0.1, label: "Position" },
      text2Content: {
        value: `Selamat Natal dan Tahun Baru 2026\nTuhan Yesus Berkati..`,
        label: "Content",
        rows: 2,
      },
      text2FontSize: {
        value: 1.5,
        min: 0.1,
        max: 10,
        step: 0.1,
        label: "Size",
      },
      text2Color: { value: "#ffffff", label: "Color" },
    }),
    Credits: folder({
      credContact: { value: "Contact : yohhannes", label: "Contact" },
      credThanks: {
        value: "Special Thanks\n@WawaSensei",
        label: "Thanks",
        rows: 2,
      },
      credPray: { value: "#Lekas Pulih Sumatera", label: "Pray", rows: 1 },
      credColor: { value: "#fbbf24", label: "Color" },
    }),
    Book: folder({
      bookPosition: { value: [35.1, 0.5, 9], step: 0.1, label: "Position" },
      bookRotation: {
        value: [0, -Math.PI / 2, 0],
        step: 0.1,
        label: "Rotation",
      },
      bookScale: { value: 0.5, min: 0.1, max: 2, step: 0.1, label: "Scale" },
    }),
  });

  const shots = [
    {
      start: values.s1_start,
      end: values.s1_end,
      target: values.s1_target,
      duration: values.s1_duration,
    },
    {
      start: values.s2_start,
      end: values.s2_end,
      target: values.s2_target,
      duration: values.s2_duration,
    },
    {
      start: values.s3_start,
      end: values.s3_end,
      target: values.s3_target,
      duration: values.s3_duration,
    },
    {
      start: values.s4_start,
      end: values.s4_end,
      target: values.s4_target,
      duration: values.s4_duration,
    },
    {
      start: values.s5_start,
      end: values.s5_end,
      target: values.s5_target,
      duration: values.s5_duration,
    },
  ];

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Determine which shot to render
    let activeIndex = 0;

    if (values.playbackMode === "Sequence") {
      activeIndex = currentShot;
    } else {
      activeIndex = Math.max(
        0,
        Math.min(Math.floor(values.selectedShot) - 1, shots.length - 1)
      );
    }

    const activeShot = shots[activeIndex];
    let progress = 0;

    // Logic based on mode
    if (values.playbackMode === "Manual Scrub") {
      progress = values.scrub;
    } else if (values.playbackMode === "Loop Shot") {
      progress = (time % activeShot.duration) / activeShot.duration;
    } else {
      // --- SEQUENCE MODE LOGIC ---
      if (shotStartTime.current === null) {
        shotStartTime.current = time;
      }

      const elapsedInShot = time - shotStartTime.current;
      progress = elapsedInShot / activeShot.duration;

      // Check if shot finished
      if (progress >= 1) {
        let nextShot = activeIndex + 1;

        if (nextShot >= shots.length) {
          nextShot = shots.length - 1; // Stay on last shot
          progress = 1; // Clamp to end
        }

        // Transition
        if (nextShot !== activeIndex) {
          setCurrentShot(nextShot);
          shotStartTime.current = time;
          progress = 1;
        }
      }
      progress = Math.min(progress, 1);
    }

    // Check if we should show the finale object (End of Shot 3)
    const isLastShot = activeIndex === shots.length - 1;
    const isFinished = isLastShot && progress >= 0.99;

    if (isFinished !== showFinale) {
      setShowFinale(isFinished);
      if (!isFinished) {
        setShowSecondFinale(false);
        setCreditStep(0);
        setShowBook(false);
      }
    }

    // Animate Text Opacities
    // Text 1 (Is You) shows only when credits are OFF and SecondFinale is OFF
    const targetOneOpacity =
      isFinished && !showSecondFinale && creditStep === 0 && !showBook ? 1 : 0;
    textOpacity.current = THREE.MathUtils.lerp(
      textOpacity.current,
      targetOneOpacity,
      0.02
    );

    // Text 2 (Greeting) shows when triggered
    const targetTwoOpacity = showSecondFinale ? 1 : 0;
    secondTextOpacity.current = THREE.MathUtils.lerp(
      secondTextOpacity.current,
      targetTwoOpacity,
      0.02
    );

    // Credits Opacities

    credit2Opacity.current = THREE.MathUtils.lerp(
      credit2Opacity.current,
      creditStep === 2 ? 1 : 0,
      0.03
    );
    credit3Opacity.current = THREE.MathUtils.lerp(
      credit3Opacity.current,
      creditStep === 3 ? 1 : 0,
      0.03
    );
    credit4Opacity.current = THREE.MathUtils.lerp(
      credit4Opacity.current,
      creditStep === 4 ? 1 : 0,
      0.03
    );

    // Apply opacities to objects
    if (textRef.current) {
      textRef.current.fillOpacity = textOpacity.current;
      textRef.current.outlineOpacity = textOpacity.current;
    }
    if (textMatRef.current) textMatRef.current.opacity = textOpacity.current;

    if (text2Ref.current) {
      text2Ref.current.fillOpacity = secondTextOpacity.current;
      text2Ref.current.outlineOpacity = secondTextOpacity.current;
    }
    if (text2MatRef.current)
      text2MatRef.current.opacity = secondTextOpacity.current;

    // Credits 2 (Contact)
    if (credContactRef.current) {
      credContactRef.current.fillOpacity = credit2Opacity.current;
      credContactRef.current.outlineOpacity = credit2Opacity.current;
    }
    if (credContactMatRef.current)
      credContactMatRef.current.opacity = credit2Opacity.current;

    // Credits 3 (Thanks)
    if (credThanksRef.current) {
      credThanksRef.current.fillOpacity = credit3Opacity.current;
      credThanksRef.current.outlineOpacity = credit3Opacity.current;
    }
    if (credThanksMatRef.current)
      credThanksMatRef.current.opacity = credit3Opacity.current;

    // Credits 4 (Pray)
    if (credPrayRef.current) {
      credPrayRef.current.fillOpacity = credit4Opacity.current;
      credPrayRef.current.outlineOpacity = credit4Opacity.current;
    }
    if (credPrayMatRef.current)
      credPrayMatRef.current.opacity = credit4Opacity.current;

    // Render Camera Transform
    const pStart = new THREE.Vector3(...activeShot.start);
    const pEnd = new THREE.Vector3(...activeShot.end);
    const pTarget = new THREE.Vector3(...activeShot.target);

    const currentPos = new THREE.Vector3().lerpVectors(pStart, pEnd, progress);

    state.camera.position.copy(currentPos);
    state.camera.lookAt(pTarget);
  });

  return (
    <>
      {showFinale && (
        <Billboard position={values.textPosition}>
          <Text
            ref={textRef}
            color={values.textColor}
            fontSize={values.textFontSize}
            font={values.textFont}
            maxWidth={10}
            lineHeight={1}
            letterSpacing={0.02}
            textAlign="center"
            fillOpacity={0}
            outlineWidth={0.05}
            outlineColor="#451a03"
            outlineOpacity={0}
          >
            {values.textContent}
            <meshStandardMaterial
              ref={textMatRef}
              color={values.textColor}
              emissive={values.textColor}
              emissiveIntensity={2}
              transparent
              opacity={0}
            />
          </Text>
        </Billboard>
      )}

      {/* Finale 2: Greeting (Now appears LAST) */}
      {showSecondFinale && (
        <Billboard position={values.text2Position}>
          <Text
            ref={text2Ref}
            color={values.text2Color}
            fontSize={values.text2FontSize}
            font={values.textFont}
            maxWidth={15}
            lineHeight={1.2}
            letterSpacing={0.02}
            textAlign="center"
            fillOpacity={0}
            outlineWidth={0.05}
            outlineColor="#000000"
            outlineOpacity={0}
          >
            {values.text2Content}
            <meshStandardMaterial
              ref={text2MatRef}
              color={values.text2Color}
              emissive={values.text2Color}
              emissiveIntensity={1}
              transparent
              opacity={0}
            />
          </Text>
        </Billboard>
      )}

      {/* Credits 2: Contact */}
      <Billboard position={values.textPosition}>
        <Text
          ref={credContactRef}
          color="#ffffff"
          fontSize={1.5}
          font={values.textFont}
          maxWidth={12}
          textAlign="center"
          fillOpacity={0}
          outlineWidth={0.03}
          outlineColor="#000000"
          outlineOpacity={0}
        >
          {values.credContact}
          {/* ADDED Emissive */}
          <meshStandardMaterial
            ref={credContactMatRef}
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.8}
            transparent
            opacity={0}
          />
        </Text>
      </Billboard>

      {/* Credits 3: Thanks */}
      <Billboard position={values.textPosition}>
        <Text
          ref={credThanksRef}
          color={values.credColor}
          fontSize={1.4}
          font={values.textFont}
          maxWidth={14}
          textAlign="center"
          lineHeight={1.4}
          fillOpacity={0}
          outlineWidth={0.03}
          outlineColor="#000000"
          outlineOpacity={0}
        >
          {values.credThanks}
          <meshStandardMaterial
            ref={credThanksMatRef}
            color={values.credColor}
            emissive={values.credColor}
            emissiveIntensity={1}
            transparent
            opacity={0}
          />
        </Text>
      </Billboard>

      {/* Credits 4: Pray */}
      <Billboard position={values.textPosition}>
        <Text
          ref={credPrayRef}
          color="#ffffff"
          fontSize={2}
          font={values.textFont}
          maxWidth={14}
          textAlign="center"
          lineHeight={1.4}
          fillOpacity={0}
          outlineWidth={0.03}
          outlineColor="#000000"
          outlineOpacity={0}
        >
          {values.credPray}
          <meshStandardMaterial
            ref={credPrayMatRef}
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.5}
            transparent
            opacity={0}
          />
        </Text>
      </Billboard>

      {/* POST-CREDITS BOOK */}
    </>
  );
};

export default CinematicCamera;
