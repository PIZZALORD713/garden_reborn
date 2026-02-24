(function registerFrienemiesSceneBootstrap(globalScope) {
  const globalObject = globalScope || window;

  function initScene() {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    // Initial framing: a bit further back + slightly lower so full body fits better on mobile
    camera.position.set(0, 1.05, 6.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    document.body.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2;
    controls.maxDistance = 14;
    controls.target.set(0, 0.92, 0);

    return { scene, camera, renderer, controls };
  }

  function initLighting(scene) {
    // r175 lighting pipeline is ~PI brighter; scale initial intensities to match r128 look
    const S = 1 / Math.PI;
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.35 * S);
    scene.add(hemisphereLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2 * S);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.65 * S);
    keyLight.position.set(-0.5, 2.5, 5);
    scene.add(keyLight);
    scene.add(keyLight.target);

    const rim = new THREE.DirectionalLight(0xffffff, 0.25 * S);
    rim.position.set(2.5, 1.5, -3.5);
    scene.add(rim);
    scene.add(rim.target);

    return { hemisphereLight, ambientLight, keyLight, rim };
  }

  function initEnvironment(scene) {
    const panoGroup = new THREE.Group();
    scene.add(panoGroup);
    return { panoGroup };
  }

  globalObject.FrienemiesSceneBootstrap = {
    initScene,
    initLighting,
    initEnvironment
  };
})(typeof window !== "undefined" ? window : this);
