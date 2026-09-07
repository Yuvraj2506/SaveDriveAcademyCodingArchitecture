"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Center, Bounds, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

interface ModelViewerProps {
  modelPath: string;
  isMonochrome?: boolean;
  rotationSpeed?: number;
  boundsMargin?: number;
}

function ModelMesh({
  modelPath,
  isMonochrome = true,
  rotationSpeed = 0.5,
}: {
  modelPath: string;
  isMonochrome?: boolean;
  rotationSpeed?: number;
}) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  const isBike = modelPath.toLowerCase().includes("motorcycle");

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // 1. Reset Sketchfab exporter's arbitrary camera tilt
    const sketchfabWrapper = clone.getObjectByName("Sketchfab_model");
    if (sketchfabWrapper) {
      sketchfabWrapper.position.set(0, 0, 0);
      sketchfabWrapper.rotation.set(0, 0, 0);
      sketchfabWrapper.scale.set(1, 1, 1);
    }

    // 2. Hide baked shadow plane
    clone.traverse((child) => {
      if (child.name.toLowerCase().includes("shadow")) {
        child.visible = false;
      }
    });

    // 3. Orient each vehicle cleanly on its wheels:
    if (isBike) {
      // Direct orientation for Bike:
      // In Bike, node 'Bike' (or 'Root') has Z as UP and X as length.
      // Pitching -90 deg on X (or rotating around X/Y/Z):
      const bikeNode = clone.getObjectByName("Bike") || clone.getObjectByName("Root");
      if (bikeNode) {
        // [X, Y, Z] angles in radians:
        bikeNode.rotation.set(-Math.PI / 2, 0, 0);
        bikeNode.position.set(0, 0, 0);
      }
    } else {
      // Direct orientation for SUV:
      const suvNode = clone.getObjectByName("Root");
      if (suvNode) {
        suvNode.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
        suvNode.position.set(0, 0, 0);
      }
    }

    // 4. Monochrome materials traversal
    if (isMonochrome) {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const rawMaterials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];

            const updatedMaterials = rawMaterials.map((origMat) => {
              const mat = origMat.clone();

              if (
                mat instanceof THREE.MeshStandardMaterial ||
                mat instanceof THREE.MeshPhysicalMaterial
              ) {
                if (mat.map) {
                  mat.color.setRGB(1, 1, 1);
                  mat.roughness = 0.45;
                  mat.metalness = 0.15;

                  mat.onBeforeCompile = (shader) => {
                    shader.fragmentShader = shader.fragmentShader.replace(
                      "#include <map_fragment>",
                      `
                      #ifdef USE_MAP
                        vec4 sampledColor = texture2D( map, vMapUv );
                        float gray = dot(sampledColor.rgb, vec3(0.299, 0.587, 0.114));
                        gray = smoothstep(0.04, 0.92, gray);
                        vec3 monoColor = mix(vec3(0.06), vec3(0.93), gray);
                        diffuseColor *= vec4(monoColor, sampledColor.a);
                      #endif
                      `
                    );
                  };
                } else {
                  const lum =
                    mat.color.r * 0.299 +
                    mat.color.g * 0.587 +
                    mat.color.b * 0.114;

                  if (lum > 0.4) {
                    mat.color.setRGB(0.92, 0.92, 0.94);
                  } else if (lum > 0.15) {
                    mat.color.setRGB(0.28, 0.28, 0.3);
                  } else {
                    mat.color.setRGB(0.08, 0.08, 0.09);
                  }

                  mat.roughness = 0.38;
                  mat.metalness = 0.25;
                }
                mat.needsUpdate = true;
              } else if (mat instanceof THREE.MeshBasicMaterial) {
                if (mat.map) {
                  mat.onBeforeCompile = (shader) => {
                    shader.fragmentShader = shader.fragmentShader.replace(
                      "#include <map_fragment>",
                      `
                      #ifdef USE_MAP
                        vec4 sampledColor = texture2D( map, vMapUv );
                        float gray = dot(sampledColor.rgb, vec3(0.299, 0.587, 0.114));
                        gray = smoothstep(0.04, 0.92, gray);
                        vec3 monoColor = mix(vec3(0.06), vec3(0.93), gray);
                        diffuseColor *= vec4(monoColor, sampledColor.a);
                      #endif
                      `
                    );
                  };
                }
                mat.needsUpdate = true;
              }

              return mat;
            });

            mesh.material =
              Array.isArray(mesh.material)
                ? updatedMaterials
                : updatedMaterials[0];
          }
        }
      });
    }

    return clone;
  }, [scene, isMonochrome, isBike]);

  // Level showroom turntable auto-rotation around Y axis
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
        Loading model...
      </span>
    </div>
  );
}

export default function VehicleModelCanvas({
  modelPath,
  isMonochrome = true,
  rotationSpeed = 0.45,
  boundsMargin = 0.94,
}: ModelViewerProps) {
  return (
    <div className="relative w-full h-[220px] select-none pointer-events-none flex items-center justify-center">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          camera={{ position: [15, 0, 0], fov: 36 }}
          className="w-full h-full pointer-events-none"
          gl={{ antialias: true, alpha: true }}
        >
          {/* Studio 3-Point Lighting Setup */}
          <ambientLight intensity={1.3} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-5, 4, -4]} intensity={0.9} />
          <directionalLight position={[0, -3, 3]} intensity={0.3} />

          {/* Calibrated Bounds margin with level ground centering */}
          <Bounds fit clip observe margin={boundsMargin}>
            <ModelMesh
              modelPath={modelPath}
              isMonochrome={isMonochrome}
              rotationSpeed={rotationSpeed}
            />
          </Bounds>

          {/* Level Ground Contact Shadow */}
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

// Preload models for immediate responsiveness
useGLTF.preload("/models/Low_Poly_SUV.glb");
useGLTF.preload("/models/Vintage_Racing_Motorcycle.glb");
