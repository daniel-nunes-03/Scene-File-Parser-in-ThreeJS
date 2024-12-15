import * as THREE from 'three';
import { MyAxis } from './MyAxis.js';
import { MyFileReader } from './parser/MyFileReader.js';
import { GraphParser } from './parser/MyGraphParser.js';
import { MyGlobals } from './parser/customClasses/01_MyGlobals.js';
import { MyCamera } from './parser/customClasses/02_MyCamera.js';
import { MyTextures } from './parser/customClasses/03_MyTextures.js';
import { MyMaterials } from './parser/customClasses/04_MyMaterials.js';

/**
 *  This class contains the contents of out application
 */
class MyContents {

    /**
     * Constructs the object.
     * @param {MyApp} app - The application object.
     */
    constructor(app) {
        this.app = app;
        // this.axis = null;

        // Initiate variables for YASF
        this.globals = null;
        this.fog = null;
        this.textures = {};
        this.materials = {};

        // Default material for when material is invalid or not specified
        this.defaultMaterial = new THREE.MeshLambertMaterial({
            color: "#ff0000",
            side: THREE.DoubleSide,
            wireframe: false
        });

        // Default material for when material is invalid or not specified,
        // and needs to support vertexColors (for polygon)
        this.defaultMaterialVertex = new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            wireframe: true,
            vertexColors: true
        });

        // Nodes storage
        this.nodes = {};
        this.rootNodeId = null;

        // Callback function for scene loading
        this.onSceneLoadedApp = function() {};

        this.reader = new MyFileReader(this.onSceneLoaded.bind(this));
        this.reader.open("scenes/demo/TP2_SCENE.json");

        // Instantiate GraphParser
        this.graphParser = new GraphParser(this.materials, this.textures, this);
    }

    /**
     * Initializes the contents.
     */
    init() {
        /*

        // create once
        if (this.axis === null) {
            // create and attach the axis to the scene
            this.axis = new MyAxis(this);
            this.app.scene.add(this.axis);
        }
        
        */
    }

    /**
     * Asynchronously called when the scene JSON file load is completed.
     * This function initiates the sequential loading of all resources needed for rendering the scene,
     * and triggers the callback to signal that the scene is fully loaded.
     *
     * @async
     * @param {Object} data - The entire scene object data loaded from the JSON file.
     * @returns {Promise<void>} - A promise that resolves when the scene has been fully loaded and parsed.
     */
    async onSceneLoaded(data) {
        console.info("YASF loaded.");
        
        // Load all resources sequentially
        await this.onAfterSceneLoadedAndBeforeRender(data);

        // Callback to signal scene is fully loaded
        this.onSceneLoadedApp();

        /*
        function debugSceneHierarchy(object, indent = '') {
            console.log(`${indent}${object.name || object.type} - visible: ${object.visible}`);
            object.children.forEach((child) => debugSceneHierarchy(child, indent + '  '));
        }
        
        console.log("Scene Hierarchy:");
        debugSceneHierarchy(this.app.scene);
        */

        //console.log("Scene Structure Log", this.app.scene);
    }

    /*
    printYASF(data, indent = '') {
        for (let key in data) {
            if (typeof data[key] === 'object' && data[key] !== null) {
                console.log(`${indent}${key}:`);
                this.printYASF(data[key], indent + '\t');
            } else {
                console.log(`${indent}${key}: ${data[key]}`);
            }
        }
    }
    */
    
    /**
     * Sequentially processes the loaded scene data after it's been loaded,
     * including loading global properties, cameras, textures, materials, and parsing the graph.
     *
     * @async
     * @param {Object} data - The entire scene object data loaded from the JSON file.
     * @returns {Promise<void>} - A promise that resolves when all resources are loaded and the graph is parsed.
     */
    async onAfterSceneLoadedAndBeforeRender(data) {
        // Step 1: Load global properties
        this.globalsRendering(data.yasf?.globals);

        // Step 2: Load cameras
        this.cameraRendering(data.yasf?.cameras);

        // Step 3: Load textures
        await this.texturesRendering(data.yasf?.textures);

        // Step 4: Load materials
        await this.materialsRendering(data.yasf?.materials);

        // Step 5: Parse and render the graph
        this.graphParser.parseGraph(data.yasf?.graph, this.app.scene);

        console.log("All resources loaded and graph parsed.");
    }

    /**
     * Renders the data regarding "globals" YASF attributes, such as background color and ambient light.
     * @param {Object} globalsData - The data regarding "globals" in YASF. Default value is empty.
     */
    globalsRendering(globalsData = {}) {
        // Checks if the initialized "globalsData" variable is an empty object
        if (Object.keys(globalsData).length !== 0) {
            this.globals = new MyGlobals(globalsData);
        } else {
            console.warn("'Globals' data not found in the provided scene file.");
            this.globals = new MyGlobals();
        }
        this.globals.applyToScene(this.app.scene);
    }

    /**
     * Renders the data regarding "cameras" YASF attributes.
     * @param {Object} cameraData - The data regarding "cameras" in YASF.
     */
    cameraRendering(cameraData = {}) {
        let initialCameraId = null;
        let firstCameraId = null;

        if (cameraData.initial !== null && cameraData.initial !== undefined) {
            initialCameraId = cameraData.initial;
        }

        for (let id in cameraData) {
            // Skip the "initial" property
            if (id === "initial") continue;

            // Set the first camera ID if not already set
            if (!firstCameraId) firstCameraId = id;

            // Create a camera and add it to MyApp cameras list
            new MyCamera(this.app, id, cameraData[id]);
        }

        // Set the initial camera as active if specified
        // If not specified but cameras have been added, default to the first camera
        // If no cameras were added, create a default camera
        if (initialCameraId && this.app.cameras[initialCameraId]) {
            this.setAndConfigureActiveCamera(initialCameraId);
        } else if (firstCameraId) {
            console.warn(`No initial camera specified. Defaulting to the first camera: ${firstCameraId}`);
            this.setAndConfigureActiveCamera(firstCameraId);
        } else {
            console.warn("'Cameras' data not found in the provided scene file. Creating a default camera.");
            firstCameraId = 'DefaultCamera';
            new MyCamera(this.app, firstCameraId, {});
            this.setAndConfigureActiveCamera(firstCameraId);
        }
    }

    /**
     * Sets the active camera and updates the OrbitControls target.
     * @param {String} cameraId - The ID of the camera to set as active.
     */
    setAndConfigureActiveCamera(cameraId) {
        this.app.setActiveCamera(cameraId);
    }

    /**
     * Asynchronously loads and processes the textures specified in the scene data.
     * It populates the "this.textures" object with the loaded textures.
     *
     * @async
     * @param {Object} texturesData - The data regarding "textures" in YASF.
     * @returns {Promise<void>} - A promise that resolves when all textures are loaded.
     */
    async texturesRendering(texturesData = {}) {
        if (Object.keys(texturesData).length === 0) {
            console.warn("'Textures' data not found in the provided scene file.");
            return;
        }
    
        const texturePromises = [];
    
        for (let textureId in texturesData) {
            // If the "textureId" is null or has already been processed, continue to the next one.
            if (!textureId || this.textures[textureId]) continue;
    
            const textureData = texturesData[textureId];
            const myTexture = new MyTextures(textureId, textureData);
    
            if (myTexture.textureId && myTexture.filepath) {
                texturePromises.push(
                    myTexture.loadTextureAsync().then(texture => {
                        if (texture) this.textures[textureId] = texture;
                    })
                );
            } else {
                console.warn(`Invalid or missing data for texture ID '${textureId}'. Skipping texture.`);
            }
        }
    
        // Wait for all textures to load
        await Promise.all(texturePromises);
        console.log("All textures loaded:", this.textures);
    }

    /**
     * Asynchronously loads and processes the materials specified in the scene data.
     * It populates the "this.materials" object with the loaded materials.
     *
     * @async
     * @param {Object} materialsData - The data regarding "materials" in YASF.
     * @returns {Promise<void>} - A promise that resolves when all materials are loaded.
     */
    async materialsRendering(materialsData = {}) {
        if (Object.keys(materialsData).length === 0) {
            console.warn("'Materials' data not found in the provided scene file.");
            return;
        }
    
        const materialPromises = [];
    
        for (let materialId in materialsData) {
            // If the "materialId" is null or has already been processed, continue to the next one.
            if (!materialId || this.materials[materialId]) continue;
    
            const materialData = materialsData[materialId];
            const myMaterial = new MyMaterials(materialId, materialData, this.textures);
    
            if (myMaterial.isValid()) {
                materialPromises.push(
                    myMaterial.createThreeMaterialAsync().then((material) => {
                        this.materials[materialId] = material;
                    })
                );
            } else {
                console.warn(`Invalid or missing data for material ID '${materialId}'. Skipping material.`);
            }
        }
    
        // Wait for all materials to load
        await Promise.all(materialPromises);
        console.log("All materials loaded:", this.materials);
    }

    update() {
    }
}

export { MyContents };
