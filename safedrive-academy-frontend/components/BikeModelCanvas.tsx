"use client";

import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Bounds, Center, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/cafe-racer.glb";

interface BikeViewerProps {
  rotationSpeed?: number;
  boundsMargin?: number;
}

function BikeMesh({
  rotationSpeed = 0.45,
}: {
  rotationSpeed?: number;
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    return scene.clone(true);
  }, [scene]);

  // Level turntable auto-rotation around vertical Y-axis
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={clonedScene} scale={2.04} />
      </Center>
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

export default function BikeModelCanvas({
  rotationSpeed = 0.45,
}: BikeViewerProps) {
  return (
    <div className="relative w-full h-[220px] select-none pointer-events-none flex items-center justify-center">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          camera={{ position: [4.6, 0, 4.6], fov: 38 }}
          className="w-full h-full pointer-events-none"
          gl={{ antialias: true, alpha: true }}
        >
          {/* Studio Lighting Setup matching CarModelCanvas */}
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[8, 12, 8]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-8, 6, -6]} intensity={1.0} />
          <directionalLight position={[0, -4, 4]} intensity={0.4} />

          <BikeMesh rotationSpeed={rotationSpeed} />

          {/* Level Ground Contact Shadow */}
          <ContactShadows
            position={[0, -1.10, 0]}
            opacity={0.42}
            scale={10}
            blur={2.0}
            far={3}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);


