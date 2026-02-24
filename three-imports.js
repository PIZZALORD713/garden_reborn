// Bridge module: import Three.js r175 ES modules and attach to window.THREE
// so all existing scripts continue working without modification.
import * as THREE_NS from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Spread into a plain object — Module Namespace Objects are non-extensible
const THREE = { ...THREE_NS };

THREE.OrbitControls = OrbitControls;
THREE.GLTFLoader = GLTFLoader;
THREE.DRACOLoader = DRACOLoader;
THREE.RGBELoader = RGBELoader;
THREE.EXRLoader = EXRLoader;
THREE.GLTFExporter = GLTFExporter;
THREE.SkeletonUtils = SkeletonUtils;

window.THREE = THREE;
