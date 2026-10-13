import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Pill, Tablet } from './objects'

interface BurstItem {
  dir: [number, number, number]
  rot: [number, number, number]
  color: string
  kind: 'pill' | 'tablet'
  scale: number
  delay: number
}

/** Capsules bursting outward from the centre — the "bill paid" celebration. */
function Burst({ onDone }: { onDone?: () => void }) {
  const group = useRef<THREE.Group>(null)
  const start = useRef<number | null>(null)
  const finished = useRef(false)

  const items = useMemo<BurstItem[]>(() => {
    const colors = ['#4CAF50', '#66BB6A', '#2E7D32', '#14B8A6', '#A7F3D0']
    return Array.from({ length: 16 }).map((_, i) => {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3
      const r = 1.6 + Math.random() * 1.4
      return {
        dir: [Math.cos(a) * r, Math.sin(a) * r * 0.7 + 0.6, (Math.random() - 0.5) * 1.5],
        rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3],
        color: colors[i % colors.length],
        kind: Math.random() > 0.45 ? 'pill' : 'tablet',
        scale: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.15,
      }
    })
  }, [])

  const objects = useRef<(THREE.Group | null)[]>([])

  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime
    const t = state.clock.elapsedTime - start.current
    items.forEach((it, i) => {
      const g = objects.current[i]
      if (!g) return
      const p = Math.max(0, Math.min(1, (t - it.delay) / 1.1))
      const eased = 1 - Math.pow(1 - p, 2)
      g.position.set(it.dir[0] * eased, it.dir[1] * eased - 2.2 * p * p, it.dir[2] * eased)
      g.rotation.set(it.rot[0] * t, it.rot[1] * t, it.rot[2] * t)
      const s = it.scale * (p < 1 ? 1 : 0.001)
      g.scale.setScalar(s)
    })
    if (t > 1.5 && !finished.current) {
      finished.current = true
      onDone?.()
    }
  })

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <group key={i} ref={(el) => (objects.current[i] = el)}>
          {it.kind === 'pill' ? <Pill color={it.color} scale={1} /> : <Tablet color={it.color} scale={1} />}
        </group>
      ))}
    </group>
  )
}

export default function SuccessBurst({ onDone }: { onDone?: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <directionalLight position={[-5, 1, -4]} intensity={1.2} color="#2dd4bf" />
      <Burst onDone={onDone} />
    </Canvas>
  )
}
