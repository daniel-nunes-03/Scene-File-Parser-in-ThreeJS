import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MyContents } from './MyContents.js';
import { MyGuiInterface } from './MyGuiInterface.js';
import Stats from 'three/addons/libs/stats.module.js'

/**
 * This class contains the application object
 */
class MyApp  {
    /**
     * The constructor.
     */
    constructor() {
        this.scene = null;
        this.stats = null;

        // Camera-related attributes
        this.activeCamera = null;
        this.activeCameraName = null;
        this.lastCameraName = null;
        this.cameras = {};
        this.frustumSize = 20;

        // Other attributes
        this.renderer = null;
        this.controls = null;
        this.gui = null;
        this.axis = null;
        this.contents = null;
    }

    /**
     * Initializes the application.
     */
    init() {
                
        // Create an empty scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#101010"); // rgb(16,16,16)

        this.stats = new Stats();
        this.stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom);

        // Create a renderer with Antialiasing
        this.renderer = new THREE.WebGLRenderer({antialias:true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor("#000000");

        // Configure renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Append Renderer to DOM
        document.getElementById("canvas").appendChild(this.renderer.domElement);

        // Initialize the default camera
        this.initDefaultCamera();
        this.setActiveCamera('Perspective');

        // Create the contents and GUI objects and set up initialization order
        this.initializeContentsAndGUI();

        // Manage window resizes
        window.addEventListener('resize', this.onResize.bind(this), false);
    }

    /**
     * Initializes contents and GUI, ensuring GUI is created after contents are loaded.
     */
    initializeContentsAndGUI() {
        // Create the contents object
        this.contents = new MyContents(this);

        // Set a callback for when scene loading is complete
        this.contents.onSceneLoadedApp = () => {
            console.info("Scene loaded. Initializing GUI...");

            // Create and initialize the GUI interface after contents are ready
            this.gui = new MyGuiInterface(this);
            this.gui.setContents(this.contents);
            this.gui.init();
        };

        // Initialize contents, which will load the scene and trigger the callback
        this.contents.init();

        // Set contents in app
        this.setContents(this.contents);
    }

    /**
     * Initializes a default perspective camera.
     */
    initDefaultCamera() {
        const aspect = window.innerWidth / window.innerHeight;

        // Create a basic perspective camera
        const perspective1 = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        perspective1.position.set(10, 10, 3);
        this.cameras['Perspective'] = perspective1;
    }

    /**
     * Sets the active camera by name and updates OrbitControls target if needed.
     * @param {String} cameraName
     */
    setActiveCamera(cameraName) {
        this.activeCameraName = cameraName;
        this.activeCamera = this.cameras[this.activeCameraName];
        
        // Initialize or re-assign OrbitControls to the new active camera
        if (this.controls === null) {
            this.controls = new OrbitControls(this.activeCamera, this.renderer.domElement);
            this.controls.enableZoom = true;
        } else {
            this.controls.object = this.activeCamera;
        }
        
        // Update target based on the active camera's target
        const target = this.activeCamera.target || new THREE.Vector3(0, 0, 0);
        this.updateOrbitControlsTarget(target);
        this.controls.update();
    }

    /**
     * Updates the OrbitControls target to the camera's defined target.
     */
    updateOrbitControlsTarget(target) {
        if (this.controls) {
            this.controls.target.copy(target);
            this.controls.update();
        } else {
            console.warn('OrbitControls not initialized. Target not updated.');
        }
    }

    /**
     * Updates the active camera if required.
     */
    updateCameraIfRequired() {
        if (this.lastCameraName !== this.activeCameraName) {
            this.lastCameraName = this.activeCameraName;
            this.activeCamera = this.cameras[this.activeCameraName];
            document.getElementById("camera").innerHTML = this.activeCameraName;
            this.onResize();
            this.controls.update();
        }
    }

    /**
     * The window resize handler.
     */
    onResize() {
        if (this.activeCamera !== undefined && this.activeCamera !== null) {
            this.activeCamera.aspect = window.innerWidth / window.innerHeight;
            this.activeCamera.updateProjectionMatrix();
            this.renderer.setSize( window.innerWidth, window.innerHeight );
        }
    }

    /**
     * @param {MyContents} contents - The contents object.
     */
    setContents(contents) {
        this.contents = contents;
    }

    /**
     * @param {MyGuiInterface} gui - The GUI interface object.
     */
    setGui(gui) {   
        this.gui = gui;
    }

    /**
     * The main render function. Called in a requestAnimationFrame loop.
     */
    render () {
        this.stats.begin();
        this.updateCameraIfRequired();

        // Update the animation if available
        if (this.contents) {
            this.contents.update();
        }

        // Required if controls.enableDamping or controls.autoRotate are set to true
        this.controls.update();

        // Render the scene
        this.renderer.render(this.scene, this.activeCamera);

        // Subsequent async calls to the render loop
        requestAnimationFrame(this.render.bind(this));

        this.stats.end();
    }
}


export { MyApp };
