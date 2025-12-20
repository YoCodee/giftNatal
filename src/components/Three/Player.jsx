// CharacterController.jsx
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import { useRef, useState, useEffect } from "react";
import {
  MathUtils,
  Vector3,
  Quaternion,
  Euler,
  Raycaster,
  Vector2,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { Character } from "../sky/Character";

// === Helper angle ===
const normalizeAngle = (angle) => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};
const lerpAngle = (start, end, t) => {
  start = normalizeAngle(start);
  end = normalizeAngle(end);
  if (Math.abs(end - start) > Math.PI) {
    if (end > start) start += 2 * Math.PI;
    else end += 2 * Math.PI;
  }
  return normalizeAngle(start + (end - start) * t);
};

const Player = ({
  canvasRef = null,
  crosshairMode = "dot",
  interactables = null,
  onInteractableChange = () => {},
  onInteract = () => {},
  disabled = false,
}) => {
  const { WALK_SPEED, RUN_SPEED, ROTATION_SPEED, RESPAWN_Y } = useControls(
    "Character Control",
    {
      WALK_SPEED: { value: 0.8, min: 0.1, max: 4, step: 0.1 },
      RUN_SPEED: { value: 1.6, min: 0.2, max: 12, step: 0.1 },
      ROTATION_SPEED: {
        value: degToRad(0.5),
        min: degToRad(0.1),
        max: degToRad(5),
        step: degToRad(0.1),
      },
      RESPAWN_Y: { value: -2.5, min: -10, max: 20, step: 0.5 },
    }
  );

  const respawnYRef = useRef(RESPAWN_Y);
  useEffect(() => {
    respawnYRef.current = RESPAWN_Y;
  }, [RESPAWN_Y]);

  const rb = useRef(); // rigidbody (player physics body)
  const container = useRef();
  const character = useRef();

  const [, setAnimation] = useState("");
  const [isRunningSound, setIsRunningSound] = useState(false);
  const characterRotationTarget = useRef(0);
  const rotationTarget = useRef(0); // horizontal
  const rotationVertical = useRef(0); // vertical
  // const cameraTarget = useRef();
  const cameraPosition = useRef();
  const cameraWorldPosition = useRef(new Vector3());
  // const cameraLookAtWorldPosition = useRef(new Vector3());
  // const cameraLookAt = useRef(new Vector3());
  const [, get] = useKeyboardControls();
  const raycasterRef = useRef(null);
  const centerNDC = useRef(new Vector2(0, 0));
  const lastHitNameRef = useRef(null);
  const wasInteractDownRef = useRef(false);
  const rayCounterRef = useRef(0);

  const JUMP_FORCE = 0.1;
  const isOnGround = useRef(true);
  const [, setCameraDistance] = useState(3); // default jarak kamera (setter only)
  const minDistance = 2;
  const maxDistance = 8;

  useEffect(() => {
    const handleWheel = (e) => {
      setCameraDistance((prev) =>
        MathUtils.clamp(prev + e.deltaY * 0.01, minDistance, maxDistance)
      );
    };

    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // right-click dragging removed - we now always allow look around when crosshair is active
  const [isHovering, setIsHovering] = useState(false);
  const lastMouse = useRef({ x: null, y: null });

  useEffect(() => {
    const handleMouseDown = () => {
      // click focus request: try to focus canvas
      if (canvasRef?.current && canvasRef.current.focus)
        canvasRef.current.focus();
    };

    const handleMouseMove = (e) => {
      const allowHoverLook = crosshairMode && crosshairMode !== "hidden";
      const shouldRotate =
        document.pointerLockElement === canvasRef?.current ||
        (allowHoverLook && isHovering);
      if (!shouldRotate) return;

      // Prefer movementX when available (works with pointer lock too), otherwise compute delta
      let dx = e.movementX;
      let dy = e.movementY;
      if (dx === undefined || dy === undefined) {
        const last = lastMouse.current;
        if (last.x === null) {
          last.x = e.clientX;
          last.y = e.clientY;
          return;
        }
        dx = e.clientX - last.x;
        dy = e.clientY - last.y;
        last.x = e.clientX;
        last.y = e.clientY;
      }

      // apply rotation
      rotationTarget.current -= dx * 0.005; // horizontal yaw
      rotationVertical.current = MathUtils.clamp(
        rotationVertical.current - dy * 0.005,
        -Math.PI / 4,
        Math.PI / 4
      );
    };

    // Attach to canvas when available to only track input over canvas.
    const currentCanvas = canvasRef?.current;
    const moveTarget = currentCanvas ?? window;
    const downTarget = currentCanvas ?? window;
    const enterTarget = currentCanvas ?? window;
    const leaveTarget = currentCanvas ?? window;
    const onEnter = () => setIsHovering(true);
    const onLeave = () => {
      setIsHovering(false);
      lastMouse.current = { x: null, y: null };
    };
    const onPointerLockChange = () => {
      // reset last mouse so when entering pointer lock we don't get a big delta
      lastMouse.current = { x: null, y: null };
    };
    downTarget.addEventListener("mousedown", handleMouseDown);
    moveTarget.addEventListener("mousemove", handleMouseMove);
    if (currentCanvas) {
      enterTarget.addEventListener("mouseenter", onEnter);
      // 'mouseleave' to stop hover
      leaveTarget.addEventListener("mouseleave", onLeave);
    }

    return () => {
      downTarget.removeEventListener("mousedown", handleMouseDown);
      moveTarget.removeEventListener("mousemove", handleMouseMove);
      if (currentCanvas) {
        enterTarget.removeEventListener("mouseenter", onEnter);
        leaveTarget.removeEventListener("mouseleave", onLeave);
      }
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, [canvasRef, isHovering, crosshairMode]);
  // === mobile touch support (kamera rotasi & zoom) ===
  useEffect(() => {
    let lastTouchPos = null;
    let lastTouchDist = null;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && lastTouchPos) {
        const dx = e.touches[0].clientX - lastTouchPos.x;
        const dy = e.touches[0].clientY - lastTouchPos.y;

        // rotasi kamera
        rotationTarget.current -= dx * 0.005;
        rotationVertical.current = MathUtils.clamp(
          rotationVertical.current - dy * 0.005,
          -Math.PI / 4,
          Math.PI / 4
        );

        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);

        if (lastTouchDist) {
          const delta = dist - lastTouchDist;
          setCameraDistance((prev) =>
            MathUtils.clamp(prev - delta * 0.01, minDistance, maxDistance)
          );
        }
        lastTouchDist = dist;
      }
    };

    const handleTouchEnd = () => {
      lastTouchPos = null;
      lastTouchDist = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  // === cek interaksi (tombol E) ===

  // lompat
  const jumpCharacter = () => {
    const vel = rb.current.linvel();
    isOnGround.current = Math.abs(vel.y) < 0.05;

    if (get().jump && isOnGround.current) {
      rb.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
    }
  };

  // jalan/lari
  // src/components/Three/Player.jsx

  // ... kode sebelumnya ...

  // jalan/lari
  const moveCharacter = () => {
    const vel = rb.current.linvel();
    const movement = { x: 0, z: 0 };
    let speed = get().run ? RUN_SPEED : WALK_SPEED;

    // W / S (Maju / Mundur) - KOREKSI
    if (get().forward) movement.z = -1;
    if (get().backward) movement.z = 1;

    // A / D (Strafe Kiri / Kanan) - SUDAH BENAR UNTUK STRAFE
    if (get().left) movement.x = -1;
    if (get().right) movement.x = 1;

    // --- BAGIAN YANG DIHAPUS/DIKOREKSI ---
    // Hapus blok yang memutar rotationTarget berdasarkan movement.x.
    // Rotasi Horizontal (rotationTarget.current) hanya diurus oleh mouse.
    // ------------------------------------

    if (movement.x !== 0 || movement.z !== 0) {
      // Hitung sudut pergerakan relatif terhadap input WASD
      characterRotationTarget.current = Math.atan2(movement.x, movement.z);

      // Arah karakter ikut rotasi kamera (rotationTarget)
      characterRotationTarget.current =
        Math.atan2(movement.x, movement.z) + rotationTarget.current;

      // Hitung dan terapkan kecepatan ke RigidBody
      vel.x = Math.sin(characterRotationTarget.current) * speed;
      vel.z = Math.cos(characterRotationTarget.current) * speed;

      setAnimation(speed === RUN_SPEED ? "run" : "walk");
    } else {
      setAnimation("idle");
    }

    character.current.rotation.y = lerpAngle(
      character.current.rotation.y,
      characterRotationTarget.current,
      0.1
    );

    // Logika sound dan animasi lainnya (tetap sama)
    if (movement.x !== 0 || movement.z !== 0) {
      if (speed === RUN_SPEED) {
        if (!isRunningSound) {
          setIsRunningSound(true);
        }
      } else {
        // kalau jalan tapi masih ada sound → stop
        if (isRunningSound) {
          setIsRunningSound(false);
        }
      }
    } else {
      setAnimation("idle");
      if (isRunningSound) {
        setIsRunningSound(false);
      }
    }

    rb.current.setLinvel(vel, true);
  };

  // ... kode setelahnya ...

  const respawnCharacter = () => {
    if (!rb.current) return;

    rb.current.setTranslation({ x: 0, y: respawnYRef.current, z: 2 }, true);
    rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true); // reset velocity
    rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true); // reset angular velocity
  };

  // Trigger respawn on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      respawnCharacter();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // update per frame
  useFrame(({ camera, scene }) => {
    if (!rb.current) return;

    // checkInteraction();
    if (!disabled) {
      jumpCharacter();
      moveCharacter();
    }

    // kamera follow (horizontal rotation)
    container.current.rotation.y = MathUtils.lerp(
      container.current.rotation.y,
      rotationTarget.current,
      0.1
    );
    const pos = rb.current.translation();
    if (pos.y < -5) {
      // Return to room if fallen
      rb.current.setTranslation(new Vector3(0, respawnYRef.current, 2), true); 
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    // cek input keyboard manual
    if (get().respawn) {
      respawnCharacter();
    }

    // --- LOGIKA KAMERA 1ST PERSON ---

    if (!disabled) {
      // 1. Dapatkan posisi kamera (eye-level)
      cameraPosition.current.getWorldPosition(cameraWorldPosition.current);
      camera.position.lerp(cameraWorldPosition.current, 0.1);

      // 2. Hitung Quaternion untuk rotasi (Yaw dari container, Pitch dari mouse input)
      // Yaw (Horizontal) - dari container (karakter)
      const yawQuat = new Quaternion().setFromEuler(
        new Euler(0, container.current.rotation.y, 0, "YXZ")
      );

      // Pitch (Vertical) - dari mouse input (sekitar sumbu X lokal)
      const pitchQuat = new Quaternion().setFromAxisAngle(
        new Vector3(1, 0, 0),
        rotationVertical.current
      );

      // Gabungkan rotasi: Yaw * Pitch
      const finalQuat = new Quaternion().multiplyQuaternions(yawQuat, pitchQuat);

      // 3. Set rotasi kamera
      camera.quaternion.slerp(finalQuat, 0.1);
    }

    // --- END LOGIKA KAMERA 1ST PERSON ---

    // Interaction: detect pointing at the named Cube or any provided interactables
    if (!raycasterRef.current) raycasterRef.current = new Raycaster();
    try {
      if (typeof onInteractableChange === "function") {
        rayCounterRef.current = (rayCounterRef.current + 1) % 8; // throttle
        const shouldCheck =
          interactables?.length > 0 || rayCounterRef.current === 0;
        if (shouldCheck) {
          raycasterRef.current.setFromCamera(centerNDC.current, camera);
          const objectsToTest =
            interactables?.length > 0 ? interactables : scene.children;
          const intersects = raycasterRef.current.intersectObjects(
            objectsToTest,
            true
          );
          let found = null;
          for (let it of intersects) {
            let o = it.object;
            while (o) {
              if (interactables?.length > 0) {
                if (interactables.includes(o)) {
                  found = o;
                  break;
                }
              }
              if (
                o.name === "Cube078" ||
                o.name === "Cube.078" ||
                (o.name &&
                  o.name.startsWith &&
                  o.name.startsWith("Cube.078")) ||
                o.name === "Cube.078_Material.025_0"
              ) {
                found = o;
                break;
              }
              o = o.parent;
            }
            if (found) break;
          }
          const nameNow = found?.name ?? null;
          // Console diagnostics for hover
          if (nameNow && nameNow !== lastHitNameRef.current) {
            console.log("Player hover start:", nameNow);
          } else if (!nameNow && lastHitNameRef.current) {
            console.log("Player hover end:", lastHitNameRef.current);
          }
          if (nameNow !== lastHitNameRef.current) {
            lastHitNameRef.current = nameNow;
            try {
              onInteractableChange(nameNow);
            } catch (err) {
              console.warn("onInteractableChange handler threw:", err);
            }
          }
          const interactDown = !!get().interact;
          if (interactDown && !wasInteractDownRef.current && nameNow) {
            console.log("Player interact triggered:", nameNow);
            try {
              onInteract?.(nameNow);
            } catch (err) {
              console.warn("onInteract handler threw:", err);
            }
          }
          wasInteractDownRef.current = interactDown;
        }
      }
    } catch (err) {
      console.warn("interaction raycast error", err);
    }
  });

  return (
    <>
      <RigidBody colliders={false} lockRotations ref={rb} position={[0, 2, 2]}>
        <group ref={container}>
          {/* Hapus group cameraTarget: <group ref={cameraTarget} position-z={1} position-y={1} /> */}
          <group
            ref={cameraPosition}
            position-y={3} // <-- Ketinggian mata (disesuaikan)
            position-z={0} // <-- Di posisi karakter, bukan di belakang
          />
          <group ref={character}>
            <Character
              scale={2}
              position-y={-0.25}
              visible={false} // <-- Sembunyikan model
            />
          </group>
        </group>
        <CapsuleCollider args={[0.6, 0.3]} />
      </RigidBody>
    </>
  );
};

export default Player;

