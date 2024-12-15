import * as THREE from 'three';
import { MyValidationUtils } from '../utils/MyValidationUtils.js';

class MyGlobals {
    constructor(globalsData = {}) {
        this.validator = new MyValidationUtils();

        // Set default values for when the values are not specified
        this.backgroundColor = this.validator.parseColor(globalsData.background || { r: 0, g: 0, b: 0 });

        // Check if ambient exists in globalsData, if not use default color and intensity
        const ambientData = globalsData.ambient || {};
        this.ambientColor = this.validator.parseColor(ambientData);
        this.ambientIntensity = this.validator.toValidFloat(ambientData.intensity, 1);


        // Check if fog data exists, if not use default values
        const fogColorData = globalsData.fog?.color || {};
        this.fogColor = this.validator.parseColor(fogColorData);
        this.fogNear = this.validator.toValidFloat(globalsData.fog?.near, 1);
        this.fogFar = this.validator.toValidFloat(globalsData.fog?.far, 1000);


        // Setup skybox data
        this.skyboxSize = {
            x: this.validator.toValidFloat(globalsData.skybox?.size?.x, 100),
            y: this.validator.toValidFloat(globalsData.skybox?.size?.y, 100),
            z: this.validator.toValidFloat(globalsData.skybox?.size?.z, 100)
        };
        this.skyboxCenter = {
            x: this.validator.toValidFloat(globalsData.skybox?.center?.x, 0),
            y: this.validator.toValidFloat(globalsData.skybox?.center?.y, 0),
            z: this.validator.toValidFloat(globalsData.skybox?.center?.z, 0)
        };

        const skyboxEmissiveData = globalsData.skybox?.emissive || {};
        this.skyboxEmissive = this.validator.parseColor(skyboxEmissiveData);
        this.skyboxIntensity = this.validator.toValidFloat(globalsData.skybox?.intensity, 1);

        this.skyboxTextures = {
            front: globalsData.skybox?.front || null,
            back: globalsData.skybox?.back || null,
            up: globalsData.skybox?.up || null,
            down: globalsData.skybox?.down || null,
            left: globalsData.skybox?.left || null,
            right: globalsData.skybox?.right || null,
        };

        this.textureLoader = new THREE.TextureLoader();
    }

    /**
     * Applies the global variables to the scene.
     * @param {Object} scene - The scene object to apply the globals to.
     */
    applyToScene(scene) {
        console.log("Globals - Background Color:", this.backgroundColor);
        console.log("Globals - Ambient Color:", this.ambientColor);
        console.log("Globals - Ambient Intensity:", this.ambientIntensity);
        console.log("Globals - Fog Color:", this.fogColor);
        console.log("Globals - Fog Near:", this.fogNear);
        console.log("Globals - Fog Far:", this.fogFar);
        console.log("Globals - Skybox Size:", this.skyboxSize);
        console.log("Globals - Skybox Center:", this.skyboxCenter);
        console.log("Globals - Skybox Emissive:", this.skyboxEmissive);
        console.log("Globals - Skybox Intensity:", this.skyboxIntensity);
        console.log("Globals - Skybox Textures:", this.skyboxTextures);

        // Set background color
        scene.background = new THREE.Color(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);

        // Set ambient light color
        if (scene.ambientLight) {
            scene.ambientLight.color.setRGB(this.ambientColor.r, this.ambientColor.g, this.ambientColor.b);
        } else {
            const ambientLight = new THREE.AmbientLight(
                new THREE.Color(this.ambientColor.r, this.ambientColor.g, this.ambientColor.b),
                this.ambientIntensity
            );
            scene.add(ambientLight);
            // Store it for future reference
            scene.ambientLight = ambientLight;
        }

        // Set fog (to see the effects you can just zoom out)
        scene.fog = new THREE.Fog(
            new THREE.Color(this.fogColor.r, this.fogColor.g, this.fogColor.b),
            this.fogNear,
            this.fogFar
        );

        // Set skybox
        this.createSkybox(scene);
    }

    /**
     * Asynchronously creates a cube with appropriate textures and adds it to the scene.
     * @param {THREE.Scene} scene - The scene to which the skybox will be applied.
     */
    async createSkybox(scene) {
        const texturePaths = [
            this.skyboxTextures.front,
            this.skyboxTextures.back,
            this.skyboxTextures.up,
            this.skyboxTextures.down,
            this.skyboxTextures.left,
            this.skyboxTextures.right
        ];
    
        const texturePromises = texturePaths.map((path) => this.loadTexture(path));
        const skyboxTextures = await Promise.all(texturePromises);
    
        const materials = skyboxTextures.map((texture) => {
            return new THREE.MeshLambertMaterial({
                map: texture,
                side: THREE.BackSide,
                emissive: this.skyboxEmissive,
                emissiveIntensity: this.skyboxIntensity
            });
        });

        const skyboxGeometry = new THREE.BoxGeometry(this.skyboxSize.x, this.skyboxSize.y, this.skyboxSize.z);
        const skybox = new THREE.Mesh(skyboxGeometry, materials);

        // Set skybox position
        skybox.position.set(this.skyboxCenter.x, this.skyboxCenter.y, this.skyboxCenter.z);
        
        scene.add(skybox);
    }

    /**
     * Dynamically loads a texture from the specified path.
     * If the texture path is invalid or the loading fails, it returns null.
     * @param {String|null} texturePath - The full path to the texture file.
     * @returns {THREE.Texture|null} - The loaded texture or null if loading fails or no path is provided.
     */
    loadTexture(texturePath) {
        return new Promise((resolve, reject) => {
            if (!texturePath) {
                resolve(null);
                return;
            }
    
            this.textureLoader.load(
                texturePath,
                (texture) => {
                    resolve(texture);
                },
                undefined,
                (err) => {
                    console.error(`Failed to load texture at path: ${texturePath}`, err);
                    resolve(null);
                }
            );
        });
    }
}

export { MyGlobals }
