"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Center, Bounds, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/vintage-4x4.glb";

interface CarViewerProps {
  rotationSpeed?: number;
  boundsMargin?: number;
}

function CarMesh({
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
        <primitive object={clonedScene} />
      </Center>
    </group>
  );
}

function CanvasFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#141414]/20 border-t-[#141414] animate-spin mb-1.5" />
      <span className="text-[10px] font-medium text-[#707070]">
        Loading car model...
      </span>
    </div>
  );
}

export default function CarModelCanvas({
  rotationSpeed = 0.45,
}: CarViewerProps) {
  return (
    <div className="relative w-full h-[220px] select-none pointer-events-none flex items-center justify-center">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          camera={{ position: [4.6, 0, 4.6], fov: 38 }}
          className="w-full h-full pointer-events-none"
          gl={{ antialias: true, alpha: true }}
        >
          {/* Studio Lighting Setup */}
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[8, 12, 8]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-8, 6, -6]} intensity={1.0} />
          <directionalLight position={[0, -4, 4]} intensity={0.4} />

          <CarMesh rotationSpeed={rotationSpeed} />

          {/* Level Ground Contact Shadow */}
          <ContactShadows
            position={[0, -1.06, 0]}
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


