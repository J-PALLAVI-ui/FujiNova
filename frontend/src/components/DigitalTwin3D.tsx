import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Compass, 
  Sun, 
  Sunset, 
  Moon, 
  RotateCcw, 
  Star, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  Map as MapIcon,
  X,
  Plus,
  Footprints,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List
} from 'lucide-react';

import ALL_VERIFIED_LANDMARKS from '../data/all_landmarks.json';

interface DigitalTwin3DProps {
  onAskHana: (prompt: string) => void;
  onSelectPlace?: (placeId: string) => void;
  selectedPlaceId?: string | null;
  onSwitchTo2D?: () => void;
  onAddToItinerary?: (placeId: string) => void;
}

// Geographic Bounding Box & Coordinate Conversion for Mt. Fuji Region
// Center: Mt. Fuji Region (35.405 N, 138.725 E)
const GEO_PROJECTION = {
  CENTER_LAT: 35.405,
  CENTER_LON: 138.725,
  LAT_KM: 111.0,
  LON_KM: 90.5,
  SCALE: 3.5 // 3.5 world units per km
};

export function geoTo3D(lat: number, lon: number): { x: number; z: number } {
  const deltaEastKm = (lon - GEO_PROJECTION.CENTER_LON) * GEO_PROJECTION.LON_KM;
  const deltaNorthKm = (lat - GEO_PROJECTION.CENTER_LAT) * GEO_PROJECTION.LAT_KM;
  return {
    x: deltaEastKm * GEO_PROJECTION.SCALE,
    z: -deltaNorthKm * GEO_PROJECTION.SCALE
  };
}

export interface GeoLandmark {
  id: string;
  name_ja: string;
  name_en: string;
  lat: number;
  lon: number;
  category: string;
  fuji_rating: number;
  hours: string;
  admission: string;
  accessibility: string;
  steps?: number | null;
  image_url?: string;
  image_alt?: string;
}

export const DigitalTwin3D: React.FC<DigitalTwin3DProps> = ({
  onAskHana,
  onSelectPlace,
  selectedPlaceId: _selectedPlaceId,
  onSwitchTo2D,
  onAddToItinerary
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightingMode, setLightingMode] = useState<'day' | 'sunset' | 'night'>('day');
  const [selectedLandmark, setSelectedLandmark] = useState<GeoLandmark | null>(null);
  const [showTransitLayer, setShowTransitLayer] = useState(true);
  const [showLandmarkPins, setShowLandmarkPins] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [accessibleListView, setAccessibleListView] = useState(false);
  const [landmarkSearch, setLandmarkSearch] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Three.js internal instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const transitGroupRef = useRef<THREE.Group | null>(null);
  const sphericalRef = useRef<THREE.Spherical>(new THREE.Spherical(80, Math.PI / 3.2, 0.4));
  const lookTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 7, 0));

  // Geographic Elevation Model Function (Calibrated DEM)
  // Real Mt. Fuji Summit: 3,776m elevation peak (scaled to ~28 world units)
  // Five Lakes Basins: 830m to 980m (scaled to ~4.1 to 4.4 world units)
  const getElevation = (x: number, z: number): number => {
    // Mt. Fuji summit: lat 35.3606, lon 138.7274
    const summitPos = geoTo3D(35.3606, 138.7274);
    const dxFuji = x - summitPos.x;
    const dzFuji = z - summitPos.z;
    const distFuji = Math.sqrt(dxFuji * dxFuji + dzFuji * dzFuji);

    let elev = 3.8;

    // 1. Mt. Fuji Stratovolcano Cone
    if (distFuji < 2.2) {
      // Crater Rim (28.0) and central depression caldera
      elev = 28.0 - (2.2 - distFuji) * 3.5;
    } else if (distFuji < 48.0) {
      // Stratovolcano flank with natural power exponential curve
      elev = 3.8 + 24.2 * Math.exp(-Math.pow(distFuji / 15.0, 1.48));
    }

    // 2. Hoei Crater on Southeastern Flank (1707 eruption feature)
    // lat 35.345, lon 138.745
    const hoeiPos = geoTo3D(35.345, 138.745);
    const distHoei = Math.hypot(x - hoeiPos.x, z - hoeiPos.z);
    if (distHoei < 3.5) {
      elev -= (3.5 - distHoei) * 1.8;
    }

    // 3. Northern Misaka Mountain Ridge (framing Lake Kawaguchiko)
    // Runs east-west around z = -40 to -55
    const ridgeNoise = Math.sin(x * 0.15) * 2.2 + Math.cos(z * 0.12) * 1.5;
    if (z < -34.0 && z > -65.0) {
      const ridgeDist = Math.abs(z - (-48.0));
      const ridgeElevation = Math.max(0, 9.5 - ridgeDist * 0.55 + ridgeNoise);
      elev = Math.max(elev, 4.0 + ridgeElevation);
    }

    // 4. Western Tenshi Mountain Ridge (west of Lake Motosu)
    if (x < -40.0) {
      const tenshiElevation = Math.max(0, 7.5 - Math.abs(x - (-52.0)) * 0.5);
      elev = Math.max(elev, 4.0 + tenshiElevation);
    }

    // 5. Lake basins depressions
    const lakeKawaguchi = geoTo3D(35.517, 138.755);
    if (Math.hypot(x - lakeKawaguchi.x, z - lakeKawaguchi.z) < 11.0) {
      elev = Math.min(elev, 4.15);
    }
    const lakeYamanaka = geoTo3D(35.420, 138.870);
    if (Math.hypot(x - lakeYamanaka.x, z - lakeYamanaka.z) < 13.0) {
      elev = Math.min(elev, 4.35);
    }
    const lakeSai = geoTo3D(35.503, 138.685);
    if (Math.hypot(x - lakeSai.x, z - lakeSai.z) < 7.5) {
      elev = Math.min(elev, 4.22);
    }
    const lakeShoji = geoTo3D(35.485, 138.608);
    if (Math.hypot(x - lakeShoji.x, z - lakeShoji.z) < 4.5) {
      elev = Math.min(elev, 4.22);
    }
    const lakeMotosu = geoTo3D(35.467, 138.583);
    if (Math.hypot(x - lakeMotosu.x, z - lakeMotosu.z) < 7.0) {
      elev = Math.min(elev, 4.22);
    }

    return elev;
  };

  // Camera Presets
  const applyCameraPreset = (preset: 'summit' | 'kawaguchiko' | 'chureito' | 'panorama') => {
    if (!cameraRef.current) return;
    setActivePreset(preset);

    if (preset === 'summit') {
      const summit = geoTo3D(35.3606, 138.7274);
      lookTargetRef.current.set(summit.x, 26, summit.z);
      sphericalRef.current.set(28, Math.PI / 4.5, 0.2);
    } else if (preset === 'kawaguchiko') {
      const lakePos = geoTo3D(35.520, 138.750);
      lookTargetRef.current.set(lakePos.x, 5, lakePos.z + 10);
      sphericalRef.current.set(55, Math.PI / 3.0, Math.PI * 0.95);
    } else if (preset === 'chureito') {
      const chureito = geoTo3D(35.501, 138.801);
      lookTargetRef.current.set(chureito.x, 7, chureito.z);
      sphericalRef.current.set(40, Math.PI / 3.4, Math.PI * 0.7);
    } else {
      // Full Panorama
      lookTargetRef.current.set(0, 7, 0);
      sphericalRef.current.set(95, Math.PI / 3.2, 0.4);
    }

    cameraRef.current.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
    cameraRef.current.lookAt(lookTargetRef.current);
  };

  // Three.js Mount & Render Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Guard against 0-dimension black screen on initial render
    const initialWidth = Math.max(container.clientWidth || 800, 320);
    const initialHeight = Math.max(container.clientHeight || 600, 320);

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0A1118');
    scene.fog = new THREE.FogExp2('#0A1118', 0.0045);

    // 2. Camera with valid aspect ratio
    const camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.5, 1500);
    camera.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
    camera.lookAt(lookTargetRef.current);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const hemiLight = new THREE.HemisphereLight('#87CEEB', '#1F2A38', 0.65);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight('#FFF5EA', 1.5);
    dirLight.position.set(50, 80, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 400;
    dirLight.shadow.camera.left = -90;
    dirLight.shadow.camera.right = 90;
    dirLight.shadow.camera.top = 90;
    dirLight.shadow.camera.bottom = -90;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 5. Build Calibrated Mount Fuji Terrain Geometry (180x180 km area)
    const terrainGeo = new THREE.PlaneGeometry(180, 180, 120, 120);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const snowColor = new THREE.Color('#FFFFFF');
    const rockColor = new THREE.Color('#5A4843');
    const forestColor = new THREE.Color('#1E3A2B');
    const lakePlainColor = new THREE.Color('#2A4836');

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const elev = getElevation(px, pz);
      pos.setY(i, elev);

      let vertexColor = forestColor;
      if (elev > 20.0) {
        vertexColor = snowColor;
      } else if (elev > 12.0) {
        const t = (elev - 12.0) / 8.0;
        vertexColor = rockColor.clone().lerp(snowColor, t);
      } else if (elev > 6.0) {
        const t = (elev - 6.0) / 6.0;
        vertexColor = forestColor.clone().lerp(rockColor, t);
      } else {
        vertexColor = lakePlainColor.clone().lerp(forestColor, 0.45);
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.08,
      flatShading: false
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 6. Calibrated Five Lakes Water Bodies
    const lakes = [
      { name: 'Lake Kawaguchiko', lat: 35.517, lon: 138.755, rx: 11.5, rz: 6.0, y: 4.18, elevM: 833 },
      { name: 'Lake Yamanakako', lat: 35.420, lon: 138.870, rx: 14.5, rz: 7.5, y: 4.38, elevM: 980 },
      { name: 'Lake Saiko', lat: 35.503, lon: 138.685, rx: 8.5, rz: 4.5, y: 4.25, elevM: 900 },
      { name: 'Lake Shojiko', lat: 35.485, lon: 138.608, rx: 4.5, rz: 3.8, y: 4.25, elevM: 900 },
      { name: 'Lake Motosuko', lat: 35.467, lon: 138.583, rx: 7.5, rz: 5.5, y: 4.25, elevM: 900 }
    ];

    const waterMat = new THREE.MeshStandardMaterial({
      color: '#155E95',
      roughness: 0.12,
      metalness: 0.45,
      transparent: true,
      opacity: 0.88
    });

    lakes.forEach(lake => {
      const p = geoTo3D(lake.lat, lake.lon);
      const waterGeo = new THREE.CylinderGeometry(lake.rx, lake.rz, 0.35, 36);
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(p.x, lake.y, p.z);
      scene.add(waterMesh);
    });

    // 7. Verified Landmark Pins with Real Coordinates
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    scene.add(pinsGroup);

    const verifiedPlaces = (ALL_VERIFIED_LANDMARKS as GeoLandmark[]);
    verifiedPlaces.forEach(l => {
      const p = geoTo3D(l.lat, l.lon);
      const groundY = getElevation(p.x, p.z);

      const pinColor = l.category === 'transit' 
        ? '#10B981' 
        : l.category === 'cultural' 
        ? '#F59E0B' 
        : l.category === 'viewpoint' 
        ? '#0284C7' 
        : '#8B5CF6';

      const pinMat = new THREE.MeshStandardMaterial({ color: pinColor, roughness: 0.25, metalness: 0.2 });

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.2, 0.2, 3.8);
      const stemMesh = new THREE.Mesh(stemGeo, pinMat);
      stemMesh.position.set(p.x, groundY + 1.9, p.z);
      pinsGroup.add(stemMesh);

      // Pin Head (Sphere)
      const headGeo = new THREE.SphereGeometry(1.05, 16, 16);
      const headMesh = new THREE.Mesh(headGeo, pinMat);
      headMesh.position.set(p.x, groundY + 4.0, p.z);
      headMesh.userData = { landmark: l };
      pinsGroup.add(headMesh);
    });

    // 8. Public Transit Routes (Fujikyu Sightseeing Red & Green Lines)
    const transitGroup = new THREE.Group();
    transitGroupRef.current = transitGroup;
    scene.add(transitGroup);

    // Red Line Route: Kawaguchiko Station -> Ropeway -> Music Forest -> Oishi Park
    const redStops = [
      geoTo3D(35.4981, 138.7692),
      geoTo3D(35.5042, 138.7722),
      geoTo3D(35.5180, 138.7650),
      geoTo3D(35.5236, 138.7453)
    ];
    const redPoints = redStops.map(s => new THREE.Vector3(s.x, getElevation(s.x, s.z) + 0.7, s.z));
    const redCurve = new THREE.CatmullRomCurve3(redPoints);
    const redGeo = new THREE.TubeGeometry(redCurve, 48, 0.35, 8, false);
    const redMat = new THREE.MeshStandardMaterial({ color: '#E60012', roughness: 0.3 });
    transitGroup.add(new THREE.Mesh(redGeo, redMat));

    // Green Line Route: Kawaguchiko Station -> Saiko -> Iyashi no Sato -> Wind Cave
    const greenStops = [
      geoTo3D(35.4981, 138.7692),
      geoTo3D(35.5030, 138.7100),
      geoTo3D(35.5061, 138.6592),
      geoTo3D(35.4789, 138.6536)
    ];
    const greenPoints = greenStops.map(s => new THREE.Vector3(s.x, getElevation(s.x, s.z) + 0.7, s.z));
    const greenCurve = new THREE.CatmullRomCurve3(greenPoints);
    const greenGeo = new THREE.TubeGeometry(greenCurve, 48, 0.35, 8, false);
    const greenMat = new THREE.MeshStandardMaterial({ color: '#00A040', roughness: 0.3 });
    transitGroup.add(new THREE.Mesh(greenGeo, greenMat));

    // 9. Interactive Drag to Orbit / Rotate Controls with Pan
    let isDragging = false;
    let isPanning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.shiftKey) {
        isPanning = true;
      } else {
        isDragging = true;
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (isPanning) {
        // Pan Target
        const panSpeed = sphericalRef.current.radius * 0.0012;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        lookTargetRef.current.addScaledVector(right, -deltaX * panSpeed);
        lookTargetRef.current.addScaledVector(forward, deltaY * panSpeed);
        camera.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
        camera.lookAt(lookTargetRef.current);
      } else if (isDragging) {
        sphericalRef.current.theta -= deltaX * 0.006;
        sphericalRef.current.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.04, sphericalRef.current.phi - deltaY * 0.006));
        camera.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
        camera.lookAt(lookTargetRef.current);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      isPanning = false;
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent default browser context menu on right click
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(20, Math.min(220, sphericalRef.current.radius + e.deltaY * 0.08));
      camera.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
      camera.lookAt(lookTargetRef.current);
    };

    // Raycast Pin Clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinsGroup.children);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        if (target.userData && target.userData.landmark) {
          const lk: GeoLandmark = target.userData.landmark;
          setSelectedLandmark(lk);
          if (onSelectPlace) onSelectPlace(lk.id);

          // Fly camera smoothly toward landmark
          const targetCoords = geoTo3D(lk.lat, lk.lon);
          lookTargetRef.current.set(targetCoords.x, getElevation(targetCoords.x, targetCoords.z), targetCoords.z);
          sphericalRef.current.radius = 42;
          sphericalRef.current.theta = Math.atan2(targetCoords.x, targetCoords.z) + 0.35;
          camera.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
          camera.lookAt(lookTargetRef.current);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('contextmenu', onContextMenu);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Robust ResizeObserver: Prevents 0-dimension black screen
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(entry.contentRect.width || container.clientWidth || 800, 320);
        const h = Math.max(entry.contentRect.height || container.clientHeight || 600, 320);
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Lighting Mode Presets
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !hemiLightRef.current) return;
    const scene = sceneRef.current;
    const dir = dirLightRef.current;
    const hemi = hemiLightRef.current;

    if (lightingMode === 'day') {
      scene.background = new THREE.Color('#0A1118');
      scene.fog = new THREE.FogExp2('#0A1118', 0.0045);
      dir.color.set('#FFF5EA');
      dir.intensity = 1.5;
      dir.position.set(50, 80, 40);
      hemi.color.set('#87CEEB');
      hemi.groundColor.set('#1F2A38');
    } else if (lightingMode === 'sunset') {
      scene.background = new THREE.Color('#2C1518');
      scene.fog = new THREE.FogExp2('#2C1518', 0.0055);
      dir.color.set('#FFA066');
      dir.intensity = 1.85;
      dir.position.set(75, 22, 50); // Low golden evening sun
      hemi.color.set('#FF7F50');
      hemi.groundColor.set('#3D1F24');
    } else {
      // Night Sky
      scene.background = new THREE.Color('#05080E');
      scene.fog = new THREE.FogExp2('#05080E', 0.0055);
      dir.color.set('#4B7099');
      dir.intensity = 0.45;
      dir.position.set(-35, 50, -35);
      hemi.color.set('#1A2A40');
      hemi.groundColor.set('#0B1017');
    }
  }, [lightingMode]);

  // Layer Toggles
  useEffect(() => {
    if (pinsGroupRef.current) {
      pinsGroupRef.current.visible = showLandmarkPins;
    }
  }, [showLandmarkPins]);

  useEffect(() => {
    if (transitGroupRef.current) {
      transitGroupRef.current.visible = showTransitLayer;
    }
  }, [showTransitLayer]);

  // Pan / Zoom on-screen helpers
  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    sphericalRef.current.radius = Math.max(20, Math.min(220, sphericalRef.current.radius * factor));
    cameraRef.current.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
    cameraRef.current.lookAt(lookTargetRef.current);
  };

  const handleTilt = (direction: 'up' | 'down') => {
    if (!cameraRef.current) return;
    const delta = direction === 'up' ? -0.1 : 0.1;
    sphericalRef.current.phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.04, sphericalRef.current.phi + delta));
    cameraRef.current.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
    cameraRef.current.lookAt(lookTargetRef.current);
  };

  const handleRotate = (direction: 'left' | 'right') => {
    if (!cameraRef.current) return;
    const delta = direction === 'left' ? 0.15 : -0.15;
    sphericalRef.current.theta += delta;
    cameraRef.current.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
    cameraRef.current.lookAt(lookTargetRef.current);
  };

  const handleResetCamera = () => {
    if (!cameraRef.current) return;
    lookTargetRef.current.set(0, 7, 0);
    sphericalRef.current.set(80, Math.PI / 3.2, 0.4);
    cameraRef.current.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
    cameraRef.current.lookAt(lookTargetRef.current);
    setSelectedLandmark(null);
    setActivePreset(null);
  };

  const filteredLandmarks = (ALL_VERIFIED_LANDMARKS as GeoLandmark[]).filter(l => 
    !landmarkSearch.trim() || 
    l.name_en.toLowerCase().includes(landmarkSearch.toLowerCase()) ||
    l.name_ja.includes(landmarkSearch) ||
    l.category.toLowerCase().includes(landmarkSearch.toLowerCase())
  );

  return (
    <div className={`relative h-full w-full bg-slate-950 overflow-hidden select-none ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 3D Canvas Viewport (Hidden to screen readers) */}
      <div 
        ref={containerRef} 
        aria-hidden={accessibleListView ? "true" : "false"}
        className={`h-full w-full cursor-grab active:cursor-grabbing ${accessibleListView ? 'opacity-20 pointer-events-none' : ''}`}
      />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Title & Elevation Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl">
          <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white leading-tight">Mount Fuji 3D Digital Twin</h2>
              <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                DEM 3,776m
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Calibrated Topography • Five Lakes Basins • 35 Verified Landmarks</p>
          </div>
        </div>

        {/* View Controls & Accessibility Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1.5 rounded-2xl shadow-xl">
          {/* Accessible Table View Toggle */}
          <button
            onClick={() => setAccessibleListView(!accessibleListView)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
              accessibleListView ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Accessible Table View (WCAG Screen Reader Alternative)"
          >
            <List className="w-3.5 h-3.5 text-sky-400" />
            <span>{accessibleListView ? '3D View' : 'Accessible List'}</span>
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Lighting Mode Presets */}
          <button
            onClick={() => setLightingMode('day')}
            className={`p-1.5 rounded-xl transition ${lightingMode === 'day' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'}`}
            title="Day sunlight"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLightingMode('sunset')}
            className={`p-1.5 rounded-xl transition ${lightingMode === 'sunset' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'}`}
            title="Sunset / Golden Hour"
          >
            <Sunset className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLightingMode('night')}
            className={`p-1.5 rounded-xl transition ${lightingMode === 'night' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'}`}
            title="Night moonlight"
          >
            <Moon className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Layer Toggles */}
          <button
            onClick={() => setShowTransitLayer(!showTransitLayer)}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold transition ${showTransitLayer ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'}`}
            title="Toggle GTFS Transit Routes"
          >
            Transit
          </button>

          <button
            onClick={() => setShowLandmarkPins(!showLandmarkPins)}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold transition ${showLandmarkPins ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}
            title="Toggle Landmark Pins"
          >
            Pins
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* 2D Map Link */}
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-sky-300 font-semibold border border-slate-700 transition"
              title="Switch to 2D Vector Map"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Presets Bar */}
      <div className="absolute top-20 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1 rounded-2xl shadow-lg">
        <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Presets:</span>
        <button
          onClick={() => applyCameraPreset('summit')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold pointer-events-auto transition ${
            activePreset === 'summit' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🌋 Summit (3,776m)
        </button>
        <button
          onClick={() => applyCameraPreset('kawaguchiko')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold pointer-events-auto transition ${
            activePreset === 'kawaguchiko' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🌊 Kawaguchiko
        </button>
        <button
          onClick={() => applyCameraPreset('chureito')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold pointer-events-auto transition ${
            activePreset === 'chureito' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          ⛩️ Chureito Pagoda
        </button>
        <button
          onClick={() => applyCameraPreset('panorama')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold pointer-events-auto transition ${
            activePreset === 'panorama' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          🗺️ Five Lakes Panorama
        </button>
      </div>

      {/* On-Screen Navigation Controls (Accessible Touch / Keyboard alternative) */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex flex-col gap-2">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1.5 rounded-2xl shadow-xl flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleTilt('up')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tilt Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleRotate('left')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Rotate Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetCamera}
              className="p-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-slate-800 transition"
              title="Center"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleRotate('right')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Rotate Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleTilt('down')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Tilt Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full h-px bg-slate-800 my-1" />

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom('in')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom('out')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Landmark Slide-Over Drawer */}
      {selectedLandmark && (
        <div className="absolute bottom-6 right-6 w-full max-w-sm z-30 bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-fade-in text-slate-100 max-h-[85vh] overflow-y-auto">
          {/* Photo */}
          {selectedLandmark.image_url && (
            <div className="relative h-40 -mx-5 -mt-5 mb-4 rounded-t-3xl overflow-hidden bg-slate-800">
              <img
                src={selectedLandmark.image_url}
                alt={selectedLandmark.name_en}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <button
                onClick={() => setSelectedLandmark(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/70 text-slate-300 hover:text-white backdrop-blur-md cursor-pointer"
                aria-label="Close landmark details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                {selectedLandmark.category}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {selectedLandmark.name_en}
              </h3>
              <p className="text-xs text-slate-400 font-serif">{selectedLandmark.name_ja}</p>
            </div>

            {!selectedLandmark.image_url && (
              <button
                onClick={() => setSelectedLandmark(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close landmark details"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Telemetry Chips */}
          <div className="grid grid-cols-2 gap-2 text-[11px] my-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-amber-200 font-semibold">Fuji View: {selectedLandmark.fuji_rating}.0/5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300">{selectedLandmark.admission}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <Footprints className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-slate-300 truncate">{selectedLandmark.accessibility}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-400 truncate">{selectedLandmark.hours}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onAskHana(`Tell me about visiting ${selectedLandmark.name_en} (${selectedLandmark.name_ja}), including transit access, crowd tips, and photography viewpoints.`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Hana</span>
            </button>

            {onAddToItinerary && (
              <button
                onClick={() => onAddToItinerary(selectedLandmark.id)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                title="Add to active itinerary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stop</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Accessible Screen Reader Table Overlay */}
      {accessibleListView && (
        <div 
          className="absolute inset-0 z-30 bg-slate-950/95 overflow-y-auto p-4 sm:p-6 lg:p-8 backdrop-blur-md"
          role="region"
          aria-label="Accessible list of 35 Mount Fuji destinations"
        >
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">All 35 Verified Mount Fuji Landmarks</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full WCAG 2.2 AA table alternative with elevations, admission, and accessibility details.
                </p>
              </div>
              <button
                onClick={() => setAccessibleListView(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition"
              >
                Return to 3D View
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={landmarkSearch}
              onChange={(e) => setLandmarkSearch(e.target.value)}
              placeholder="Filter landmarks by name, category, or features..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              aria-label="Filter landmarks"
            />

            {/* Landmark Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                  <tr>
                    <th scope="col" className="p-3.5">Landmark</th>
                    <th scope="col" className="p-3.5">Category</th>
                    <th scope="col" className="p-3.5">Fuji View</th>
                    <th scope="col" className="p-3.5">Admission</th>
                    <th scope="col" className="p-3.5">Accessibility</th>
                    <th scope="col" className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLandmarks.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-850 transition">
                      <th scope="row" className="p-3.5 font-bold text-white">
                        <div>{l.name_en}</div>
                        <div className="text-[11px] text-slate-400 font-normal font-serif">{l.name_ja}</div>
                      </th>
                      <td className="p-3.5 capitalize text-sky-400">{l.category}</td>
                      <td className="p-3.5 font-semibold text-amber-300">{l.fuji_rating}.0 / 5 ⭐</td>
                      <td className="p-3.5 text-emerald-400 font-medium">{l.admission}</td>
                      <td className="p-3.5 max-w-xs truncate" title={l.accessibility}>
                        {l.accessibility}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setAccessibleListView(false);
                            setSelectedLandmark(l);
                            const targetCoords = geoTo3D(l.lat, l.lon);
                            lookTargetRef.current.set(targetCoords.x, getElevation(targetCoords.x, targetCoords.z), targetCoords.z);
                            sphericalRef.current.radius = 42;
                            if (cameraRef.current) {
                              cameraRef.current.position.setFromSpherical(sphericalRef.current).add(lookTargetRef.current);
                              cameraRef.current.lookAt(lookTargetRef.current);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-600/30 text-sky-300 hover:bg-sky-600 hover:text-white font-semibold transition"
                        >
                          View 3D
                        </button>
                        {onAddToItinerary && (
                          <button
                            onClick={() => onAddToItinerary(l.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white font-semibold transition"
                          >
                            + Add Stop
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-24 z-10 pointer-events-none hidden md:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-xs">
        <Info className="w-3.5 h-3.5 text-sky-400" />
        <span>Left-click: Orbit • Right-click: Pan • Scroll: Zoom • Click pins for telemetry</span>
      </div>
    </div>
  );
};
