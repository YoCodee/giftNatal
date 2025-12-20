import {  useGLTF } from "@react-three/drei";
import React, {  useRef } from "react";

export function Character({  ...props }) {
  const group = useRef();
  const { nodes, materials } = useGLTF("/models/CharacterBaru.glb");




  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="fall_guys">
          <skinnedMesh
            name="body"
            geometry={nodes.body.geometry}
            material={materials["Material.001"]}
            skeleton={nodes.body.skeleton}
          />
          <skinnedMesh
            name="eye"
            geometry={nodes.eye.geometry}
            material={materials["Material.001"]}
            skeleton={nodes.eye.skeleton}
          />
          <skinnedMesh
            name="hand-"
            geometry={nodes["hand-"].geometry}
            material={materials["Material.001"]}
            skeleton={nodes["hand-"].skeleton}
          />
          <skinnedMesh
            name="leg"
            geometry={nodes.leg.geometry}
            material={materials["Material.001"]}
            skeleton={nodes.leg.skeleton}
          />
          <primitive object={nodes._rootJoint} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/CharacterBaru.glb");
