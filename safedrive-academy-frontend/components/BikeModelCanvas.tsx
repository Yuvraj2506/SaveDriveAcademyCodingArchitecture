"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage } from "@react-three/drei";

const MODEL_PATH = "/models/Vintage_Racing_Motorcycle.glb";

// Exact component from gltf.pmnd.rs / gltfjsx
export function BikeModel(props: any) {
  const { nodes, materials } = useGLTF(MODEL_PATH) as any;
  return (
    <group {...props} dispose={null}>
      <group
        position={[-0.592, -50.47, -8028.552]}
        rotation={[-1.452, 0, -2.753]}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Shadow_0.geometry}
          material={materials.Shadow}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Bike_0_0.geometry}
          material={materials.Bike}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Bike_0_1.geometry}
          material={materials.Bike}
        />
      </group>
    </group>
  );
}

function CanvasFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#141414]/20 border-t-[#141414] animate-spin mb-1.5" />
      <span className="text-[10px] font-medium text-[#707070]">
        Loading bike model...
      </span>
    </div>
  );
}

export default function BikeModelCanvas() {
  return (
    <div className="relative w-full h-[220px] select-none pointer-events-none flex items-center justify-center">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          camera={{ position: [95, 42, 55], fov: 50 }}
          className="w-full h-full pointer-events-none"
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <Stage
            preset="rembrandt"
            intensity={1}
            environment={null}
            adjustCamera
            shadows={false}
          >
            <BikeModel />
          </Stage>
        </Canvas>
      </Suspense>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
