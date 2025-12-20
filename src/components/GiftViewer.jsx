import React, { useRef, useEffect, useMemo, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Box3, Vector3, Sphere, AnimationMixer, LoopOnce } from "three";
import { useFrame } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";

export default function GiftViewer({
  url,
  target = 5.0,
  cameraPadding = 10.0,
  cameraFov = 120,
}) {
  if (useGLTF.preload) useGLTF.preload(url);
  const gltf = useGLTF(url);
  const { camera } = useThree();
  const ref = useRef();
  const cloneRef = useRef(null);
  const mixerRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // compute bounding box and adjust position and scale to fit into view
  useEffect(() => {
    const root = ref.current;
    if (!root || !gltf?.scene) return;
    // compute bounds from the original gltf scene
    const box = new Box3().setFromObject(gltf.scene);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    // target max dimension in world units
    const scale = maxDim > 0 ? target / maxDim : 1;
    root.scale.setScalar(scale);

    // center pivot
    const center = new Vector3();
    box.getCenter(center);
    root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    // compute bounding sphere based on original box and apply scale
    const sphere = new Sphere();
    box.getBoundingSphere(sphere);
    sphere.radius *= scale;

    // move camera back so the sphere fits into view with some margin
    if (camera) {
      const fov = (cameraFov * Math.PI) / 180; // rad
      const distance = sphere.radius / Math.sin(fov / 2) + cameraPadding; // add margin
      // Set along z-axis relative to re-centered model (root at origin)
      const yOffset = size.y * scale * 0.6; // raise camera a bit above model center
      camera.position.set(0, Math.max(yOffset, 0.3), Math.abs(distance));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [gltf, camera, cameraFov, cameraPadding, target]);

  // clone the scene for the local overlay so we can apply animations to the clone
  const clonedScene = useMemo(
    () => (gltf?.scene ? SkeletonUtils.clone(gltf.scene) : null),
    [gltf?.scene]
  );
  
  useEffect(() => {
    if (!clonedScene) return;
    cloneRef.current = clonedScene;
    mixerRef.current = new AnimationMixer(cloneRef.current);
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(cloneRef.current);
        mixerRef.current = null;
      }
      cloneRef.current = null;
    };
  }, [clonedScene]);

  useFrame((state, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (!gltf?.animations || gltf.animations.length === 0) {
      console.log("GiftViewer: no animations available to play.");
      return;
    }
    const clip = gltf.animations.find(
      (c) => c.name && c.name.toLowerCase().includes("take 001")
    );
    if (!clip) {
      console.log("GiftViewer: 'Take 001' animation not found.");
      return;
    }
    if (!mixerRef.current || !cloneRef.current) {
      console.warn("GiftViewer: mixer or cloned scene not ready yet.");
      return;
    }
    mixerRef.current.stopAllAction();
    const action = mixerRef.current.clipAction(clip, cloneRef.current);
    action.reset();
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    console.log("GiftViewer: Playing animation:", clip.name);
  };

  useEffect(() => {
    if (!gltf) return;
    if (gltf.animations && gltf.animations.length > 0) {
      console.log(
        "GiftViewer: model has animations:",
        gltf.animations.map((c) => c.name)
      );
    } else {
      console.log("GiftViewer: model has no animation clips");
    }
  }, [gltf]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  return (
    <group
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {gltf && clonedScene && <primitive object={clonedScene} />}
      {hovered && (
        <Html position={[0, 0, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
          <div
            style={{
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              fontSize: "14px",
              fontWeight: "bold",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            Klik Kiri untuk membuka
          </div>
        </Html>
      )}
    </group>
  );
}
