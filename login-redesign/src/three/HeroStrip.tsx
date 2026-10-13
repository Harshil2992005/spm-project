import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import { MedicalCross, Pill, Tablet } from './objects'

/**
 * A calm, low-opacity hero strip: floating capsules + tablets that drift and
 * gently follow the pointer. Rendered behind page titles so text stays legible.
 * Only mounted when the device can afford WebGL (see PageHero wrapper).
 */
function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    g.rotation.y += (state.pointer.x * 0.28 - g.rotation.y) * Math.min(1, dt * 2.5)
    g.rotation.x += (-state.pointer.y * 0.16 - g.rotation.x) * Math.min(1, dt * 2.5)
  })
  return <group ref={group}>{children}</group>
}

function Items() {
  const items = [
    { pos: [-3.1, 0.5, 0.2], rot: [0.3, 0.2, 0.7], color: '#4CAF50', s: 0.9, kind: 'pill' },
    { pos: [3.2, -0.2, -0.3], rot: [-0.2, 0.4, 0.9], color: '#66BB6A', s: 1.0, kind: 'pill' },
    { pos: [-1.6, -1.1, -0.6], rot: [0.5, -0.3, 0.2], color: '#2E7D32', s: 0.75, kind: 'pill' },
    { pos: [1.8, 1.0, -0.7], rot: [0.1, 0.3, 0], color: '#eef2f7', s: 0.85, kind: 'tablet' },
    { pos: [0.1, -1.4, -1.0], rot: [0.2, -0.2, 0.4], color: '#f8fafc', s: 0.7, kind: 'tablet' },
  ] as const

  return (
    <>
      <Float speed={1.1} rotationIntensity={0.4} floatIntensity={0.9}>
        <MedicalCross position={[0, 0.15, 0]} emissive="#4CAF50" intensity={1.5} scale={0.72} />
      </Float>
      {items.map((o, i) => (
        <Float key={i} speed={0.8 + (i % 3) * 0.25} rotationIntensity={0.7} floatIntensity={1.1}>
          {o.kind === 'pill' ? (
            <Pill
              position={o.pos as unknown as [number, number, number]}
              rotation={o.rot as unknown as [number, number, number]}
              color={o.color}
              scale={o.s}
            />
          ) : (
            <Tablet
              position={o.pos as unknown as [number, number, number]}
              rotation={o.rot as unknown as [number, number, number]}
              color={o.color}
              scale={o.s}
            />
          )}
        </Float>
      ))}
    </>
  )
}

export default function HeroStrip({ paused }: { paused?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 1, -4]} intensity={1.2} color="#2dd4bf" />
      <Suspense fallback={null}>
        <Rig>
          <Items />
        </Rig>
      </Suspense>
    </Canvas>
  )
}
