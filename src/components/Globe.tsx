import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import earthImage from '@/assets/earth-texture.jpg';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Region {
  id: string;
  name: string;
  country: string;
  position: { lat: number; lon: number }; // Real world coordinates
  subregions: string[];
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

// Convert lat/lon to 3D sphere coordinates
const latLonToVector3 = (lat: number, lon: number, radius: number = 2) => {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lon - 180) * Math.PI) / 180;
  
  const x = -(radius * Math.cos(phi) * Math.cos(theta)) - 0.1;
  const y = radius * Math.sin(phi) - 0.15;
  const z = radius * Math.cos(phi) * Math.sin(theta);
  
  return [x, y, z];
};

const regions: Region[] = [
  {
    id: 'punjab',
    name: 'Punjab',
    country: 'India',
    position: { lat: 31.0, lon: 75.0 },
    subregions: ['Northern Punjab', 'Central Punjab', 'Southern Punjab'],
    bbox: [73.8, 29.5, 76.5, 32.5]
  },
  {
    id: 'kerala',
    name: 'Kerala',
    country: 'India', 
    position: { lat: 10.0, lon: 76.5 },
    subregions: ['Northern Kerala', 'Central Kerala', 'Southern Kerala'],
    bbox: [75.7, 8.2, 77.3, 10.2]
  },
  {
    id: 'ganges',
    name: 'Ganges Basin',
    country: 'India',
    position: { lat: 26.0, lon: 84.5 },
    subregions: ['Upper Ganges', 'Middle Ganges', 'Lower Ganges'],
    bbox: [80.0, 23.0, 89.0, 29.0]
  },
  {
    id: 'central-valley',
    name: 'Central Valley',
    country: 'California, USA',
    position: { lat: 37.0, lon: -120.5 },
    subregions: ['Sacramento Valley', 'San Joaquin Valley'],
    bbox: [-122.0, 36.0, -119.0, 38.0]
  },
  {
    id: 'southern-coast',
    name: 'Southern Coast',
    country: 'California, USA',
    position: { lat: 34.0, lon: -118.5 },
    subregions: ['Los Angeles Basin', 'San Diego County'],
    bbox: [-120.0, 33.0, -117.0, 35.0]
  },
  {
    id: 'midwest-corn',
    name: 'Midwest Corn Belt',
    country: 'USA',
    position: { lat: 41.5, lon: -93.5 },
    subregions: ['Iowa Corn Belt', 'Illinois Plains', 'Indiana Fields'],
    bbox: [-96.0, 39.0, -89.0, 44.0]
  },
  {
    id: 'great-plains',
    name: 'Great Plains',
    country: 'USA',
    position: { lat: 39.0, lon: -101.0 },
    subregions: ['Nebraska Plains', 'Kansas Wheat Belt', 'Oklahoma Panhandle'],
    bbox: [-104.0, 36.0, -96.0, 42.0]
  },
  {
    id: 'pampas',
    name: 'Pampas',
    country: 'Argentina',
    position: { lat: -34.5, lon: -60.0 },
    subregions: ['Buenos Aires Province', 'Santa Fe Plains', 'Córdoba Region'],
    bbox: [-65.0, -39.0, -57.0, -30.0]
  },
  {
    id: 'cerrado',
    name: 'Cerrado',
    country: 'Brazil',
    position: { lat: -15.0, lon: -52.0 },
    subregions: ['Mato Grosso', 'Goiás', 'Bahia Cerrado'],
    bbox: [-60.0, -25.0, -42.0, -5.0]
  },
  {
    id: 'murray-darling',
    name: 'Murray-Darling Basin',
    country: 'Australia',
    position: { lat: -34.0, lon: 143.0 },
    subregions: ['Murray Valley', 'Darling Plains', 'Riverina'],
    bbox: [138.0, -38.0, 149.0, -28.0]
  },
  {
    id: 'po-valley',
    name: 'Po Valley',
    country: 'Italy',
    position: { lat: 45.0, lon: 10.5 },
    subregions: ['Lombardy Plains', 'Veneto Region', 'Emilia-Romagna'],
    bbox: [7.0, 44.0, 13.0, 46.0]
  },
  {
    id: 'ukraine-plains',
    name: 'Ukrainian Plains',
    country: 'Ukraine',
    position: { lat: 49.0, lon: 32.0 },
    subregions: ['Central Ukraine', 'Southern Ukraine', 'Eastern Plains'],
    bbox: [22.0, 45.0, 40.0, 52.0]
  },
  {
    id: 'nile-delta',
    name: 'Nile Delta',
    country: 'Egypt',
    position: { lat: 30.5, lon: 31.0 },
    subregions: ['Lower Delta', 'Upper Delta', 'Cairo Region'],
    bbox: [29.5, 29.5, 32.5, 31.5]
  },
  {
    id: 'north-china',
    name: 'North China Plain',
    country: 'China',
    position: { lat: 36.0, lon: 116.0 },
    subregions: ['Hebei Province', 'Shandong Plain', 'Henan Region'],
    bbox: [112.0, 32.0, 120.0, 40.0]
  },
  {
    id: 'indus-valley',
    name: 'Indus Valley',
    country: 'Pakistan',
    position: { lat: 29.0, lon: 71.0 },
    subregions: ['Punjab Pakistan', 'Sindh Province', 'Upper Indus'],
    bbox: [67.0, 24.0, 75.0, 34.0]
  }
];

// 3D Earth component
const Earth3D = ({ onRegionSelect, selectedRegion, hoveredRegion, setHoveredRegion }: {
  onRegionSelect: (region: Region) => void;
  selectedRegion?: Region;
  hoveredRegion: string | null;
  setHoveredRegion: (id: string | null) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const earthTexture = useTexture(earthImage);
  
  // Auto-rotate to selected region
  useEffect(() => {
    if (selectedRegion && groupRef.current) {
      const targetRegion = regions.find(r => r.id === selectedRegion.id);
      if (targetRegion) {
        // Convert lat/lon to rotation angles
        const targetY = -(targetRegion.position.lon * Math.PI) / 180;
        const targetX = (targetRegion.position.lat * Math.PI) / 180;
        
        // Animate to target rotation
        const startY = groupRef.current.rotation.y;
        const startX = groupRef.current.rotation.x;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function for smooth animation
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          if (groupRef.current) {
            groupRef.current.rotation.y = startY + (targetY - startY) * easeProgress;
            groupRef.current.rotation.x = startX + (targetX - startX) * easeProgress * 0.3; // Less dramatic X rotation
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    }
  }, [selectedRegion]);

  // Configure texture for proper earth mapping
  earthTexture.wrapS = THREE.RepeatWrapping;
  earthTexture.wrapT = THREE.RepeatWrapping;
  earthTexture.repeat.set(1, -1);
  earthTexture.flipY = false;

  useFrame((state, delta) => {
    if (groupRef.current && !hoveredRegion) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Earth Sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={earthTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Atmosphere effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial 
          color="#66d7ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Region Markers */}
      {regions.map((region) => {
        const [x, y, z] = latLonToVector3(region.position.lat, region.position.lon, 2.1);
        const isSelected = selectedRegion?.id === region.id;
        const isHovered = hoveredRegion === region.id;

        return (
          <group key={region.id} position={[x, y, z]}>
            {/* Marker Sphere */}
            <mesh
              onClick={() => onRegionSelect(region)}
              onPointerEnter={() => setHoveredRegion(region.id)}
              onPointerLeave={() => setHoveredRegion(null)}
            >
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#ff6500' : isHovered ? '#66d7ff' : '#22c55e'}
                emissive={isSelected ? '#ff6500' : isHovered ? '#66d7ff' : '#22c55e'}
                emissiveIntensity={0.4}
              />
            </mesh>

            {/* Pulse Ring Animation */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.12, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#ff6500' : '#22c55e'}
                transparent
                opacity={isHovered ? 0.8 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Pin line connecting to surface */}
            <mesh position={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.01, 0.01, 0.1]} />
              <meshBasicMaterial 
                color={isSelected ? '#ff6500' : isHovered ? '#66d7ff' : '#22c55e'}
                transparent
                opacity={0.8}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

interface GlobeProps {
  onRegionSelect: (region: Region) => void;
  selectedRegion?: Region;
}

const Globe = ({ onRegionSelect, selectedRegion }: GlobeProps) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* 3D Globe Container */}
      <div className="relative w-96 h-96 mx-auto">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          
          <Earth3D
            onRegionSelect={onRegionSelect}
            selectedRegion={selectedRegion}
            hoveredRegion={hoveredRegion}
            setHoveredRegion={setHoveredRegion}
          />
          
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            autoRotate={!hoveredRegion}
            autoRotateSpeed={0.5}
          />
        </Canvas>
        
        {/* Hover Label */}
        {hoveredRegion && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
              {regions.find(r => r.id === hoveredRegion)?.name}
              <br />
              <span className="text-muted-foreground text-xs">
                {regions.find(r => r.id === hoveredRegion)?.country}
              </span>
            </Badge>
          </div>
        )}
      </div>
      
      {/* Globe Controls */}
      <div className="text-center mt-6 space-y-2">
        <p className="text-muted-foreground text-sm">
          Click and drag to rotate • Scroll to zoom • Click regions to analyze soil moisture data
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          {regions.map((region) => (
            <Button
              key={region.id}
              variant={selectedRegion?.id === region.id ? "default" : "outline"}
              size="sm"
              onClick={() => onRegionSelect(region)}
              className="text-xs"
            >
              {region.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Globe;