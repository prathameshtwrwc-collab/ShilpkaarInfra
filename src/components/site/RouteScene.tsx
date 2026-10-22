"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/*
 * Survey-style terrain relief: contour lines over a gently rolling site,
 * with the haul route drawn from source (quarry) to the active site.
 * `progress` (0–1) is scroll-driven by the parent.
 */

const W = 34;
const D = 18;

function height(x: number, z: number) {
  // Quarry depression near the source, a raised platform at the site.
  const base = Math.sin(x * 0.28) * 0.55 + Math.cos(z * 0.45 + x * 0.12) * 0.45 + Math.sin((x + z) * 0.6) * 0.15;
  const quarry = -2.2 * Math.exp(-((x + 11) ** 2 + (z - 2) ** 2) / 18);
  const site = 0.9 * Math.exp(-((x - 11) ** 2 + (z + 1) ** 2) / 22);
  return base + quarry + site;
}

const WAYPOINTS: [number, number][] = [
  [-11, 2],
  [-3.5, -3.5],
  [5, 2.5],
  [11.5, -1],
];

function Terrain() {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const rows = 34;
    const cols = 120;
    for (let r = 0; r <= rows; r++) {
      const z = -D / 2 + (r / rows) * D;
      for (let c = 0; c < cols; c++) {
        const x1 = -W / 2 + (c / cols) * W;
        const x2 = -W / 2 + ((c + 1) / cols) * W;
        pts.push(x1, height(x1, z), z, x2, height(x2, z), z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#c4bcae" transparent opacity={0.32} />
    </lineSegments>
  );
}

function Route({ progress }: { progress: React.MutableRefObject<number> }) {
  const loadRef = useRef<THREE.Mesh>(null);
  const markers = useRef<(THREE.Mesh | null)[]>([]);
  const { curve, geo, count } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    WAYPOINTS.forEach(([x, z], i) => {
      pts.push(new THREE.Vector3(x, height(x, z) + 0.12, z));
      if (i < WAYPOINTS.length - 1) {
        const [nx, nz] = WAYPOINTS[i + 1];
        const mx = (x + nx) / 2;
        const mz = (z + nz) / 2 + (i % 2 ? 1.6 : -1.6);
        pts.push(new THREE.Vector3(mx, height(mx, mz) + 0.12, mz));
      }
    });
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    const samples = curve.getSpacedPoints(400).map((p) => new THREE.Vector3(p.x, height(p.x, p.z) + 0.14, p.z));
    const geo = new THREE.BufferGeometry().setFromPoints(samples);
    return { curve: new THREE.CatmullRomCurve3(samples), geo, count: samples.length };
  }, []);

  const routeLine = useMemo(() => new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#f06a1f" })), [geo]);
  const current = useRef(0);
  useFrame((_, dt) => {
    current.current = THREE.MathUtils.damp(current.current, progress.current, 4, dt);
    const t = Math.max(0.001, Math.min(1, current.current));
    geo.setDrawRange(0, Math.floor(t * count));
    if (loadRef.current) {
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      loadRef.current.position.set(p.x, p.y + 0.22, p.z);
      loadRef.current.rotation.y = Math.atan2(-tan.z, tan.x);
    }
    markers.current.forEach((m, i) => {
      if (!m) return;
      const reached = t >= i / (WAYPOINTS.length - 1) - 0.02;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.color.set(reached ? "#f06a1f" : "#5f594f");
      const s = THREE.MathUtils.damp(m.scale.x, reached ? 1.25 : 1, 6, dt);
      m.scale.setScalar(s);
    });
  });

  return (
    <group>
      <primitive object={routeLine} />
      {WAYPOINTS.map(([x, z], i) => {
        const y = height(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 1.4, 0]}>
              <boxGeometry args={[0.02, 2.8, 0.02]} />
              <meshBasicMaterial color="#c4bcae" transparent opacity={0.5} />
            </mesh>
            <mesh ref={(el) => void (markers.current[i] = el)} position={[0, 2.85, 0]}>
              <boxGeometry args={[0.32, 0.32, 0.32]} />
              <meshBasicMaterial color="#5f594f" />
            </mesh>
          </group>
        );
      })}
      <mesh ref={loadRef}>
        <boxGeometry args={[0.7, 0.32, 0.36]} />
        <meshBasicMaterial color="#f2eee6" />
      </mesh>
    </group>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  useFrame((_, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 2.2, 2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 15.5 + pointer.y * 1.2, 2, dt);
    camera.lookAt(0, 0.6, 0);
  });
  return null;
}

export default function RouteScene({ progress, active }: { progress: React.MutableRefObject<number>; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 15.5, 23], fov: 36, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden="true"
    >
      <Terrain />
      <Route progress={progress} />
      <Rig />
    </Canvas>
  );
}
