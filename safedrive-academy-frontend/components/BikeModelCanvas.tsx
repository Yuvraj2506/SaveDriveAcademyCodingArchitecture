"use client";

import React, { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Bounds, Center, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/Vintage_Racing_Motorcycle.glb";

// Exact component from gltf.pmnd.rs / gltfjsx
function BikeMesh({
  rotationSpeed = 0.45,
}: {
  rotationSpeed?: number;
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Reset Sketchfab exporter's arbitrary camera tilt and position
    const sketchfabWrapper = clone.getObjectByName("Sketchfab_model");
    if (sketchfabWrapper) {
      sketchfabWrapper.position.set(0, 0, 0);
      sketchfabWrapper.rotation.set(-Math.PI / 2, 0, 0);
      sketchfabWrapper.scale.set(1, 1, 1);
    }

    // Hide baked polygon shadow plane so ContactShadows handles it cleanly
    clone.traverse((child) => {
      if (child.name.toLowerCase().includes("shadow")) {
        child.visible = false;
      }
    });

    return clone;
  }, [scene]);

  // Level turntable auto-rotation around vertical Y-axis
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      <Center bottom>
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
        Loading bike model...
      </span>
    </div>
  );
}

export default function BikeModelCanvas({
  rotationSpeed = 0.45,
  boundsMargin = 0.94,
}: {
  rotationSpeed?: number;
  boundsMargin?: number;
}) {
  return (
    <div className="relative w-full h-[220px] select-none pointer-events-none flex items-center justify-center">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          camera={{ position: [15, 0, 0], fov: 36 }}
          className="w-full h-full pointer-events-none"
          gl={{ antialias: true, alpha: true }}
        >
          {/* Studio 3-Point Lighting Setup matching CarModelCanvas */}
          <ambientLight intensity={1.3} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 4, -4]} intensity={0.9} />
          <directionalLight position={[0, -3, 3]} intensity={0.3} />

          {/* Calibrated Bounds margin matching car scale & centering */}
          <Bounds fit clip observe margin={boundsMargin}>
            <BikeMesh rotationSpeed={rotationSpeed} />
          </Bounds>

          {/* Level Ground Contact Shadow matching CarModelCanvas */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.45}
            scale={10}
            blur={2.2}
            far={3.8}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
