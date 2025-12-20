import React from "react";
import { useGLTF } from "@react-three/drei";

const Sky = () => {
  const { scene } = useGLTF("/models/extracted_minecraft_java_editions_stars.glb");
  return <primitive object={scene} />;
};

export default Sky;
