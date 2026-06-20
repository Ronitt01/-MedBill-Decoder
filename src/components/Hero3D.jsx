import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  Float,
  Html,
  Lightformer,
  MeshTransmissionMaterial,
  RoundedBox,
  Sparkles,
} from '@react-three/drei'
import { useIsLowPower } from '../lib/useIsLowPower.js'

const ROWS = [
  { code: '70551', label: 'MRI brain', amount: '$2,100', flag: 'red' },
  { code: '85025', label: 'CBC w/ diff', amount: '$95', flag: 'red' },
  { code: '80053', label: 'Metabolic panel', amount: '$120', flag: 'yellow' },
  { code: '93000', label: 'ECG complete', amount: '$145', flag: 'yellow' },
  { code: '71046', label: 'Chest X-ray', amount: '$38', flag: 'green' },
]

const FLAG_HEX = { red: '#FF5C72', yellow: '#FFC857', green: '#46E0A0' }

function FloatingPill({ position, color, delay = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime + delay
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * 1.3) * 0.12
      ref.current.material.emissiveIntensity = 1.6 + Math.sin(t * 2) * 0.6
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.07, 24, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} toneMapped={false} />
    </mesh>
  )
}

function BillCard() {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.32
    }
  })

  return (
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.7}>
      <group ref={group}>
        {/* Glass bill */}
        <RoundedBox args={[2.7, 3.5, 0.12]} radius={0.09} smoothness={5}>
          <MeshTransmissionMaterial
            samples={6}
            thickness={0.6}
            roughness={0.12}
            transmission={1}
            ior={1.25}
            chromaticAberration={0.05}
            anisotropy={0.2}
            distortion={0.1}
            distortionScale={0.2}
            color="#bdf6f0"
            attenuationColor="#7ff0e7"
            attenuationDistance={2}
          />
        </RoundedBox>

        {/* Bill content rendered on the glass surface */}
        <Html
          transform
          distanceFactor={4}
          position={[0, 0, 0.08]}
          className="pointer-events-none select-none"
          style={{ width: '230px' }}
        >
          <div className="rounded-xl p-4 font-sans">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                Itemized Bill
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-white/60">
                AUDIT
              </span>
            </div>
            <div className="space-y-2">
              {ROWS.map((r) => (
                <div key={r.code} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: FLAG_HEX[r.flag], boxShadow: `0 0 8px ${FLAG_HEX[r.flag]}` }}
                  />
                  <span className="w-[42px] font-mono text-[10px] text-white/55">{r.code}</span>
                  <span className="flex-1 truncate text-[10px] text-white/80">{r.label}</span>
                  <span
                    className="font-mono text-[10px] font-semibold"
                    style={{ color: r.flag === 'green' ? '#cdeede' : FLAG_HEX[r.flag] }}
                  >
                    {r.amount}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="text-[9px] uppercase tracking-widest text-white/45">Potential errors</div>
              <div className="font-mono text-lg font-bold text-flag-red">$3,171</div>
            </div>
          </div>
        </Html>

        {/* Floating flag pills around the card */}
        <FloatingPill position={[1.7, 1.2, 0.6]} color={FLAG_HEX.red} delay={0} />
        <FloatingPill position={[-1.8, 0.2, 0.4]} color={FLAG_HEX.green} delay={1.5} />
        <FloatingPill position={[1.6, -1.1, 0.5]} color={FLAG_HEX.yellow} delay={3} />
        <FloatingPill position={[-1.6, -1.4, 0.3]} color={FLAG_HEX.red} delay={2.2} />
      </group>
    </Float>
  )
}

function Scene() {
  const sparkleColor = useMemo(() => '#7ff0e7', [])
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-4, 2, 3]} intensity={40} color="#3DD4C8" />
      <pointLight position={[4, -2, 2]} intensity={25} color="#FF5C72" />

      <BillCard />
      <Sparkles count={60} scale={9} size={2.4} speed={0.3} opacity={0.5} color={sparkleColor} />

      {/* In-scene environment for glass reflections — no network HDR needed. */}
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 3, 4]} scale={[6, 3, 1]} color="#7ff0e7" />
        <Lightformer intensity={1.4} position={[-4, 0, 2]} scale={[3, 6, 1]} color="#3DD4C8" />
        <Lightformer intensity={1} position={[4, -2, 2]} scale={[4, 4, 1]} color="#ffffff" />
      </Environment>
    </>
  )
}

function CssFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      <div className="glass-strong relative w-[260px] rotate-[-4deg] rounded-2xl p-5 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
            Itemized Bill
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/60">AUDIT</span>
        </div>
        <div className="space-y-2.5">
          {ROWS.map((r) => (
            <div key={r.code} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: FLAG_HEX[r.flag], boxShadow: `0 0 8px ${FLAG_HEX[r.flag]}` }}
              />
              <span className="w-[44px] font-mono text-[10px] text-white/55">{r.code}</span>
              <span className="flex-1 truncate text-[11px] text-white/80">{r.label}</span>
              <span
                className="font-mono text-[11px] font-semibold"
                style={{ color: r.flag === 'green' ? '#cdeede' : FLAG_HEX[r.flag] }}
              >
                {r.amount}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="text-[9px] uppercase tracking-widest text-white/45">Potential errors</div>
          <div className="font-mono text-xl font-bold text-flag-red">$3,171</div>
        </div>
      </div>
    </div>
  )
}

export default function Hero3D() {
  const lowPower = useIsLowPower()

  if (lowPower) return <CssFallback />

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
