import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls } from '@react-three/drei';

function PlaceholderDish() {
    const meshRef = useRef();

    // Subtle continuous rotation
    useFrame((state, delta) => {
        meshRef.current.rotation.y += delta * 0.2;
    });

    return (
        <group>
            {/* The "Plate" */}
            <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[2, 1.8, 0.2, 32]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />

                {/* Center "Food" Accent */}
                <mesh position={[0, 0.3, 0]}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="#FD6941" roughness={0.4} />
                </mesh>

                {/* Secondary accents */}
                <mesh position={[0.8, 0.2, 0.5]}>
                    <boxGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial color="#4CAF50" roughness={0.6} />
                </mesh>
            </mesh>
        </group>
    );
}

export default function Hero3D() {
    return (
        <div className="w-full h-full absolute inset-0 z-0 pointer-events-auto">
            <Canvas shadows camera={{ position: [0, 4, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                <PresentationControls
                    global
                    config={{ mass: 2, tension: 500 }}
                    snap={{ mass: 4, tension: 1500 }} // Snap back to center
                    rotation={[0, 0.3, 0]}
                    polar={[-Math.PI / 3, Math.PI / 3]} // Vertical limits
                    azimuth={[-Math.PI / 1.4, Math.PI / 2]} // Horizontal limits
                >
                    <Float
                        speed={2}
                        rotationIntensity={0.5}
                        floatIntensity={1.5}
                    >
                        <PlaceholderDish />
                    </Float>
                </PresentationControls>

                <ContactShadows
                    position={[0, -1.5, 0]}
                    opacity={0.4}
                    scale={10}
                    blur={2}
                    far={4}
                />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
