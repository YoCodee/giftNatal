// MapModel.jsx
import { useGLTF } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import React, { useEffect, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls } from "leva";
export function ChristmasRoom({
  onSignpostReady,
  onBattlepostReady,
  onInteractablesReady,
  modelPath = "/models/Lekkuterakhir1.glb",
}) {
  const gltf = useGLTF(modelPath);
  const scene = gltf.scene;
  const gltfAnimations = React.useMemo(
    () => gltf.animations || [],
    [gltf.animations]
  );
  const signpost = scene.getObjectByName("hut_small003_104");
  const battlepost = scene.getObjectByName("hut_mid_96");



  useEffect(() => {
    // Find named interactables in the scene and notify the parent via callback
    const found = [];
    const meta = {};
    // look for nodes that are named exactly 'Cube.078' or start with 'Cube.078',
    // or old name 'Cube.078_Material.025_0' to be tolerant of GLTF naming.
     const namesToMatch = ["Cube078", "Object_6","asiap"];

    scene.traverse((o) => {
      if (!o || !o.name) return;
      // match exact or prefix names
      if (namesToMatch.some((n) => o.name === n || o.name.startsWith(n))) {
        found.push(o);
        // collect animation clips from the glTF that target this object (best-effort via track name)
        const clips = gltfAnimations.filter((clip) =>
          clip.tracks.some((t) => t.name && o.name && t.name.includes(o.name))
        );
        meta[o.uuid] = { name: o.name, clips };
      }
    });
    if (found.length > 0) onInteractablesReady?.(found, meta);
  }, [scene, onInteractablesReady, gltfAnimations]);

  // Animation and Object_6 interaction logic removed as requested

  // Animation mixer update removed

  // Twinkle light small helper
  const Twinkle = ({ position, color = "#ffd6a3", base = 0.3 }) => {
    const ref = useRef();
    useFrame(({ clock }) => {
      if (!ref.current) return;
      const t = clock.getElapsedTime();
      ref.current.intensity =
        base + Math.sin(t * 5 + position[0]) * 0.2 + Math.random() * 0.05;
    });
    return (
      <pointLight
        ref={ref}
        position={position}
        color={color}
        distance={3}
        decay={2}
      />
    );
  };

  // GodRays: faux volumetric light shafts using additive cones and a SpotLight
  const GodRays = ({
    from = [0, 8, 10],
    to = [0, 1, -2],
    color = "#ffdca8",
  }) => {
    const groupRef = useRef();
    const lightRef = useRef();
    // precompute lookAt rotation
    const pFrom = new THREE.Vector3(...from);
    const pTo = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(pTo, pFrom).normalize();
    const height = pFrom.distanceTo(pTo) * 1.4;
    useFrame(({ clock }) => {
      const t = clock.getElapsedTime();
      if (lightRef.current) {
        lightRef.current.intensity = 1.1 + Math.sin(t * 0.6) * 0.15;
      }
      if (groupRef.current) {
        // small sway to mimic particles
        groupRef.current.rotation.z = Math.sin(t * 0.2) * 0.01;
      }
    });

    // create three cones with different radii and opacities
    const cones = [
      { radius: 5.0, opacity: 0.16 },
      { radius: 3.5, opacity: 0.12 },
      { radius: 2.2, opacity: 0.08 },
    ];

    const materialProps = (opacity) => ({
      transparent: true,
      opacity,
      color,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const rot = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir
    );
    return (
      <group ref={groupRef} position={from}>
        <group quaternion={rot}>
          <spotLight
            ref={lightRef}
            position={from}
            // target will align by parent quaternion
            angle={Math.PI / 8}
            penumbra={0.45}
            intensity={1}
            color={color}
            distance={30}
          />
          {cones.map((c, i) => (
            <mesh
              key={i}
              position={[0, -height / 2, 0]}
              rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
              renderOrder={10 + i}
            >
              <coneGeometry args={[c.radius, height, 32, 1, true]} />
              <meshBasicMaterial {...materialProps(c.opacity)} />
            </mesh>
          ))}
          {/* Debug spheres removed by default for performance */}
        </group>
      </group>
    );
  };

  // try to auto-detect a window/glass object in the gltf scene and compute from/to positions

  // (Removed gold emissive/pulsing as requested)

  useEffect(() => {
    if (signpost) {
      onSignpostReady?.(signpost);
    }
  }, [signpost, onSignpostReady]);

  useEffect(() => {
    if (battlepost) {
      onBattlepostReady?.(battlepost);
    }
  }, [battlepost, onBattlepostReady]);
  const {
    mainLightIntensity,
    mainLightColor,
    mainLightPosition,
    mainLightDistance,
  } = useControls("Main Room Light", {
    mainLightIntensity: {
      value: 4.95, // Nilai default
      min: 0,
      max: 15, // Batas maksimum intensitas
      step: 0.05,
      label: "Intensity",
    },
    mainLightColor: {
      value: "#ff9a3d", // Nilai default (Orange)
      label: "Color",
    },
    mainLightPosition: {
      value: [0.8, 4.9, 2.1], // Nilai default posisi
      step: 0.1,
      label: "Position (X, Y, Z)",
    },
    mainLightDistance: {
      value: 40, // Nilai default jarak
      min: 1,
      max: 1000,
      step: 1,
      label: "Distance",
    },
  });
  // Stage spotlight controls via Leva
  const {
    stageEnabled,
    stageColor,
    stageIntensity,
    stagePosition,
    stageTarget,
    stageAngleDeg,
    stagePenumbra,
    stageDistance,
    stageDecay,
    stageCastShadow,
    showBeam,
    beamOpacity,
  } = useControls("Stage Spotlight", {
    stageEnabled: { value: true },
    stageColor: { value: "#ffffff" },
    stageIntensity: { value: 2, min: 0, max: 10, step: 0.1 },
    stagePosition: { value: [-0.6, -25.4, 17.0], step: 0.1 },
    stageTarget: { value: [-3.7, 0.1, 3.7], step: 0.1 },
    stageAngleDeg: {
      value: 11,
      min: 1,
      max: 60,
      step: 1,
      label: "Angle (deg)",
    },
    stagePenumbra: { value: 0.4, min: 0, max: 1, step: 0.05 },
    stageDistance: { value: 30, min: 1, max: 200, step: 1 },
    stageDecay: { value: 2, min: 0, max: 5, step: 0.1 },
    stageCastShadow: { value: true },
    showBeam: { value: true },
    beamOpacity: { value: 0.22, min: 0, max: 1, step: 0.01 },
  });

  const {
    fillLightIntensity,
    fillLightColor,
    fillLightPosition,
    fillLightDistance
  } = useControls("Room Fill Light", {
    fillLightIntensity: { value: 46.4, min: 0, max: 100, step: 0.1, label: "Intensity" },
    fillLightColor: { value: "#c4dcff", label: "Color" },
    fillLightPosition: { value: [-5, 5, -5], step: 0.1, label: "Position" },
    fillLightDistance: { value: 100, min: 1, max: 100, step: 1, label: "Distance" }
  });

  const { roomScale } = useControls("Christmas Room", {
    roomScale: { value: 2, min: 0.1, max: 10, step: 0.1, label: "Scale" }
  });

  const defaultPosition = [0, 0, 2];
  const defaultRotation = [0, 0, 0];

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh">
         {/* Floor Collider to prevent falling since trimesh is disabled */}
         <CuboidCollider args={[100, 0.5, 100]} position={[0, -0.5, 0]} />
        <primitive 
          object={scene} 
          scale={roomScale} 
          position={defaultPosition} 
          rotation={defaultRotation}
        />
      </RigidBody>
      
      {/* Decorative warm lights */}
      <Twinkle position={[1.5, 2.2, -1]} color="#ffd4a3" base={0.5} />
      <Twinkle position={[-1, 2.0, -2]} color="#ffdeb5" base={0.4} />
      <Twinkle position={[0.6, 1.1, -2.3]} color="#ffb77a" base={0.4} />
      <Twinkle position={[2, 3, 2]} color="#ffb77a" base={0.5} />

      {/* small point soft glow near gift */}
      <pointLight
        position={[0, 1.1, -2.1]}
        color="#ffecd4"
        intensity={0.45}
        distance={2.5}
        decay={2}
      />
      {/* gold sphere emissive light (will be pulsed in useFrame) */}
      {/* additional warm fill to slightly brighten the room while keeping it cozy */}
      <pointLight 
        position={fillLightPosition} 
        color={fillLightColor} 
        intensity={fillLightIntensity} 
        distance={fillLightDistance} 
        decay={2} 
      />
      <pointLight
        position={[0, 2.0, 0]}
        color="#ffdfbe"
        intensity={0.35}
        distance={6}
        decay={2}
      />
      {/* Ceiling lamp: warm orange point light with small bulb */}
      <pointLight
        position={mainLightPosition} // Menggunakan nilai dari Leva
        color={mainLightColor} // Menggunakan nilai dari Leva (color picker)
        intensity={mainLightIntensity} // Menggunakan nilai dari Leva (slider)
        distance={mainLightDistance} // Menggunakan nilai dari Leva (slider)
        decay={2}
        castShadow
      />

      {/* Stage Spotlight (user adjustable via Leva) */}
      <StageSpotlight
        enabled={stageEnabled}
        color={stageColor}
        intensity={stageIntensity}
        position={stagePosition}
        target={stageTarget}
        angleDeg={stageAngleDeg}
        penumbra={stagePenumbra}
        distance={stageDistance}
        decay={stageDecay}
        castShadow={stageCastShadow}
        showBeam={showBeam}
        beamOpacity={beamOpacity}
      />
    </>
  );
}

function StageSpotlight({
  enabled = true,
  color = "#ffffff",
  intensity = 2,
  position = [0.5, 3.6, 3.5],
  target = [0, 1, -2],
  angleDeg = 11,
  penumbra = 0.4,
  distance = 30,
  decay = 2,
  castShadow = true,
  showBeam = true,
  beamOpacity = 0.2,
}) {
  const spotRef = useRef();
  const targetRef = useRef();
  const fixtureRef = useRef();
  const beamRef = useRef();

  const angleRad = useMemo(() => (angleDeg * Math.PI) / 180, [angleDeg]);

  useEffect(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current;
    }
  }, [spotRef, targetRef]);

  useFrame(() => {
    if (!spotRef.current) return;
    // Update spot position and its target
    spotRef.current.position.set(...position);
    if (targetRef.current) targetRef.current.position.set(...target);
    // rotate fixture to look at target
    if (fixtureRef.current && targetRef.current) {
      fixtureRef.current.lookAt(...target);
    }
    // update beam geometry: compute height and radius from angle
    if (beamRef.current && targetRef.current) {
      const pFrom = new THREE.Vector3(...position);
      const pTo = new THREE.Vector3(...target);
      const dist = pFrom.distanceTo(pTo);
      const radius = Math.tan(angleRad) * dist;
      // Scale the cone to reach the target
      beamRef.current.scale.set(radius, dist, radius);
      // Align beam to direction
      const dir = new THREE.Vector3().subVectors(pTo, pFrom).normalize();
      const rot = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir
      );
      beamRef.current.quaternion.copy(rot);
      beamRef.current.position.copy(pFrom.clone().add(pTo).multiplyScalar(0.5));
    }
  });

  return (
    <group>
      <spotLight
        ref={spotRef}
        position={position}
        color={color}
        intensity={enabled ? intensity : 0}
        angle={angleRad}
        penumbra={penumbra}
        distance={distance}
        decay={decay}
        castShadow={castShadow}
      />
      {/* directionalLight removed to reduce scene complexity, main key light positioned elsewhere */}
      {/* visual target */}
      <mesh ref={targetRef} position={target} visible={true}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* fixture mesh (small lamp body) */}
      <mesh
        ref={fixtureRef}
        position={position}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.12, 0.16, 0.28, 10]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} />
        {/* small bulb */}
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            emissive={color}
            emissiveIntensity={Math.min(intensity * 0.5, 4)}
            color="#111"
          />
        </mesh>
      </mesh>

      {/* beam visual */}
      {showBeam && (
        <mesh ref={beamRef} position={position} renderOrder={20}>
          <coneGeometry args={[1, 1, 32, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={beamOpacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload("/models/Lekkuterakhir1.glb");
export default ChristmasRoom;
