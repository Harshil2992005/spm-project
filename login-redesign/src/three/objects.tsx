import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Builds a canvas texture rendering the "Rx" label (avoids loading webfonts). */
function useRxTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#2E7D32'
    ctx.font = 'bold 150px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Rx', size / 2, size / 2 + 8)
    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 4
    return tex
  }, [])
}

interface ShapeProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

/** Two-tone capsule pill with a glossy clearcoat. */
export function Pill({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = '#4CAF50',
}: ShapeProps & { color?: string }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main body (coloured half) */}
      <mesh castShadow receiveShadow position={[0, -0.28, 0]}>
        <capsuleGeometry args={[0.34, 0.5, 8, 24]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.15}
        />
      </mesh>
      {/* White half */}
      <mesh castShadow receiveShadow position={[0, 0.28, 0]}>
        <capsuleGeometry args={[0.34, 0.5, 8, 24]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.8} />
      </mesh>
    </group>
  )
}

/** Round tablet with a score line. */
export function Tablet({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = '#ffffff',
}: ShapeProps & { color?: string }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.12, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.4} clearcoat={0.7} />
      </mesh>
      {/* Score line */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.5, 0.02, 0.02]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </group>
  )
}

/** Glass medicine bottle with an "Rx" label, cap and liquid. */
export function Bottle({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: ShapeProps) {
  const rx = useRxTexture()
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 1.25, 40]} />
        <meshPhysicalMaterial
          color="#eafaf1"
          roughness={0.08}
          transmission={0.85}
          thickness={0.7}
          ior={1.4}
          clearcoat={1}
        />
      </mesh>
      {/* Liquid */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.7, 32]} />
        <meshPhysicalMaterial color="#4CAF50" roughness={0.15} transmission={0.4} thickness={0.6} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.28, 28]} />
        <meshPhysicalMaterial color="#eafaf1" roughness={0.1} transmission={0.8} thickness={0.5} />
      </mesh>
      {/* Cap */}
      <mesh castShadow position={[0, 0.86, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.26, 28]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Rx label */}
      <mesh position={[0, -0.1, 0.56]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial map={rx} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Glowing extruded medical cross (the brand centrepiece). */
export function MedicalCross({
  position = [0, 0, 0],
  scale = 1,
  emissive = '#4CAF50',
  intensity = 1.6,
}: ShapeProps & { emissive?: string; intensity?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25
  })
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 1.5, 0.5]} />
        <meshPhysicalMaterial
          color="#7CF19A"
          emissive={emissive}
          emissiveIntensity={intensity}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.5, 0.5]} />
        <meshPhysicalMaterial
          color="#7CF19A"
          emissive={emissive}
          emissiveIntensity={intensity}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>
    </group>
  )
}

/** Mortar & pestle centrepiece. */
export function Mortar({ position = [0, 0, 0], scale = 1 }: ShapeProps) {
  return (
    <group position={position} scale={scale}>
      {/* Bowl (open hemisphere) */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 40, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.35}
          clearcoat={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.06, 16, 48]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      {/* Pestle */}
      <mesh castShadow position={[0.42, 0.55, 0]} rotation={[0, 0, -0.7]}>
        <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
        <meshPhysicalMaterial color="#dbeafe" roughness={0.3} clearcoat={0.7} />
      </mesh>
    </group>
  )
}

/** Slow-drifting bokeh dust particles. */
export function Dust({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#a7f3d0" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}
