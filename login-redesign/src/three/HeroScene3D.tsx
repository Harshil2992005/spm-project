import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Float, Html, AdaptiveDpr, Preload } from '@react-three/drei'
import * as THREE from 'three'
import { Bottle, Dust, MedicalCross, Mortar, Pill, Tablet } from './objects'

export type SceneMood = 'idle' | 'focus' | 'typing' | 'error' | 'success'

interface SceneProps {
  mood: SceneMood
}

/** A single interactive object: hover → scale + tooltip, click → spin. */
function Interactive({
  label,
  baseScale = 1,
  children,
}: {
  label: string
  baseScale?: number
  children: React.ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const spin = useRef(0)

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const target = (hovered ? 1.1 : 1) * baseScale
    g.scale.lerp(new THREE.Vector3(target, target, target), 0.12)
    if (spin.current > 0) {
      g.rotation.y += dt * 10
      spin.current = Math.max(0, spin.current - dt)
    }
  })

  return (
    <group
      ref={group}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        spin.current = 0.45
      }}
      scale={baseScale}
    >
      {children}
      {hovered && (
        <Html center distanceFactor={10} position={[0, 1.5, 0]} zIndexRange={[20, 0]}>
          <span className="pointer-events-none whitespace-nowrap rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
            {label}
          </span>
        </Html>
      )}
    </group>
  )
}

/** Parallax rig + mood reactions (shake on error, dolly on success). */
function Rig({ mood, children }: { mood: SceneMood; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const shake = useRef(0)

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return

    // Smooth parallax toward the pointer.
    const targetY = state.pointer.x * 0.4
    const targetX = -state.pointer.y * 0.22
    g.rotation.y += (targetY - g.rotation.y) * Math.min(1, dt * 3)
    g.rotation.x += (targetX - g.rotation.x) * Math.min(1, dt * 3)

    // Error → decaying shake.
    if (mood === 'error') shake.current = 0.4
    if (shake.current > 0) {
      g.position.x = Math.sin(state.clock.elapsedTime * 55) * shake.current * 0.12
      shake.current = Math.max(0, shake.current - dt)
    } else {
      g.position.x *= 0.9
    }

    // Success → gentle dolly-in, else rest.
    const targetZ = mood === 'success' ? 4.2 : 6.4
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 2)
    camera.lookAt(0, 0, 0)
  })

  return <group ref={group}>{children}</group>
}

function Lights({ mood }: { mood: SceneMood }) {
  const dim = mood === 'focus' ? 0.55 : 1
  const keyColor = mood === 'error' ? '#f59e0b' : '#ffffff'
  return (
    <>
      <ambientLight intensity={0.55 * dim} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.6 * dim}
        color={keyColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Teal rim light */}
      <directionalLight position={[-6, 2, -4]} intensity={1.4 * dim} color="#2dd4bf" />
      <pointLight position={[0, -3, 2]} intensity={0.6 * dim} color="#4CAF50" />
    </>
  )
}

/** The floating pharmacy objects, laid out around the centre. */
function Objects({ mood }: { mood: SceneMood }) {
  const crossEmissive = mood === 'error' ? '#f59e0b' : mood === 'success' ? '#22c55e' : '#4CAF50'
  const crossIntensity = mood === 'success' ? 3.2 : mood === 'error' ? 2.6 : 1.7

  const layout = useMemo(
    () =>
      [
        { key: 'pill-a', label: 'Inventory', color: '#4CAF50', pos: [-2.6, 1.1, 0.4], rot: [0.4, 0.3, 0.6], s: 0.9, kind: 'pill' },
        { key: 'pill-b', label: 'Prescriptions', color: '#66BB6A', pos: [2.5, 0.8, 0.2], rot: [-0.3, 0.5, 0.9], s: 1.05, kind: 'pill' },
        { key: 'pill-c', label: 'Billing', color: '#2E7D32', pos: [2.9, -1.3, -0.6], rot: [0.6, -0.4, 0.2], s: 0.8, kind: 'pill' },
        { key: 'pill-d', label: 'Reports', color: '#43A047', pos: [-2.9, -1.5, -0.3], rot: [-0.5, 0.2, 1.1], s: 0.85, kind: 'pill' },
        { key: 'tab-a', label: 'Alerts', color: '#e2e8f0', pos: [-1.2, 1.9, -0.9], rot: [0.2, 0.1, 0], s: 0.9, kind: 'tablet' },
        { key: 'tab-b', label: 'Stock', color: '#f1f5f9', pos: [1.4, 1.8, -0.7], rot: [-0.2, 0.4, 0], s: 0.85, kind: 'tablet' },
        { key: 'tab-c', label: 'Orders', color: '#eef2f7', pos: [3.3, 1.9, -1.1], rot: [0.3, -0.2, 0], s: 0.7, kind: 'tablet' },
      ] as const,
    [],
  )

  return (
    <>
      {/* Centrepiece */}
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
        <Interactive label="PharmaMS" baseScale={0.9}>
          <MedicalCross position={[0, 0.1, 0]} emissive={crossEmissive} intensity={crossIntensity} scale={1.1} />
        </Interactive>
      </Float>

      <Float speed={1} rotationIntensity={0.6} floatIntensity={1.2}>
        <Interactive label="Compounding">
          <Mortar position={[-3.4, 0.2, -1.2]} scale={0.75} />
        </Interactive>
      </Float>

      <Float speed={1} rotationIntensity={0.5} floatIntensity={1.4}>
        <Interactive label="Medicines">
          <Bottle position={[3.3, -0.1, 0.9]} rotation={[0, -0.5, 0]} scale={0.8} />
        </Interactive>
      </Float>

      {/* Floating pills & tablets */}
      {layout.map((o, i) => (
        <Float key={o.key} speed={0.9 + (i % 3) * 0.3} rotationIntensity={0.8} floatIntensity={1.3}>
          <Interactive label={o.label} baseScale={o.s}>
            {o.kind === 'pill' ? (
              <Pill position={o.pos as unknown as [number, number, number]} rotation={o.rot as unknown as [number, number, number]} color={o.color} scale={1} />
            ) : (
              <Tablet position={o.pos as unknown as [number, number, number]} rotation={o.rot as unknown as [number, number, number]} color={o.color} scale={1} />
            )}
          </Interactive>
        </Float>
      ))}
    </>
  )
}

/**
 * The lazy-loaded WebGL hero. Mounted only on capable devices (see
 * useDeviceProfile) and wrapped in Suspense by the parent.
 */
export default function HeroScene3D({ mood }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      className="!touch-none"
    >
      <fog attach="fog" args={['#0b1220', 8, 20]} />
      <Suspense fallback={null}>
        <Lights mood={mood} />
        <Rig mood={mood}>
          <Objects mood={mood} />
          <Dust count={70} />
        </Rig>
        <ContactShadows position={[0, -3, 0]} opacity={0.32} scale={16} blur={2.6} far={6} color="#0f172a" />
        <AdaptiveDpr pixelated />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}
