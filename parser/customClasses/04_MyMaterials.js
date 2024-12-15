import * as THREE from 'three';
import { MyValidationUtils } from '../utils/MyValidationUtils.js';

class MyMaterials {
    constructor(materialId, materialData = {}, textures = {}) {
        this.validator = new MyValidationUtils();
        this.materialId = materialId;

        this.color = this.validator.parseColor(materialData.color || { r: 255, g: 255, b: 255 });
        this.specular = this.validator.parseColor(materialData.specular || { r: 255, g: 255, b: 255 });
        this.emissive = this.validator.parseColor(materialData.emissive || { r: 0, g: 0, b: 0 });

        this.shininess = this.validator.toValidFloat(materialData.shininess, 30);
        this.transparent = this.validator.parseBoolean(materialData.transparent);
        this.opacity = this.validator.toValidOpacity(materialData.opacity, 1.0);
        this.wireframe = this.validator.parseBoolean(materialData.wireframe);
        this.shading = this.validator.parseBoolean(materialData.shading);
        this.twosided = this.validator.parseBoolean(materialData.twosided);

        // Texture references
        this.textureref = this.getTexture(textures, materialData.textureref);
        this.texlength_s = this.validator.toValidFloat(materialData.texlength_s, 1);
        this.texlength_t = this.validator.toValidFloat(materialData.texlength_t, 1);

        // Optional bump map settings
        this.bumpref = this.getTexture(textures, materialData.bumpref);
        this.bumpscale = this.validator.toValidFloat(materialData.bumpscale, 1.0);

        // Optional specular map
        this.specularref = this.getTexture(textures, materialData.specularref);
    }

    /**
     * Asynchronously gets a texture from the provided textures if the texture reference is valid.
     * @param {Object} textures - Loaded textures.
     * @param {String} ref - The texture reference ID.
     * @returns {Promise<THREE.Texture|null>} - The texture or null if invalid.
     */
    async getTexture(textures, ref) {
        if (!ref || !textures[ref]) return null;

        // Ensure the texture is fully loaded (if it uses an async loader)
        return textures[ref] instanceof Promise
            ? await textures[ref] // Await for the Promise to resolve
            : textures[ref]; // Return directly if already loaded
    }

    /**
     * Checks if the material has a valid configuration.
     * @returns {Boolean} - Returns true if valid.
     */
    isValid() {
        return this.color && this.specular && this.shininess >= 0;
    }

    /**
     * Asynchronously creates and returns a THREE.Material based on this configuration.
     * @returns {Promise<THREE.Material>} - The created material.
     */
    async createThreeMaterialAsync() {
        const mapTexture = await this.textureref;
        const bumpTexture = await this.bumpref;
        const specularTexture = await this.specularref;

        const materialConfig = {
            color: this.color,
            specular: this.specular,
            shininess: this.shininess,
            emissive: this.emissive,
            transparent: this.transparent,
            opacity: this.opacity,
            wireframe: this.wireframe,
            side: this.twosided ? THREE.DoubleSide : THREE.FrontSide,
            map: mapTexture,
            bumpMap: bumpTexture,
            bumpScale: this.bumpscale,
            specularMap: specularTexture,
            flatShading: this.shading
        };

        const material = new THREE.MeshPhongMaterial(materialConfig);

        // Attach texlength_s and texlength_t to the material for later use
        material.texlength_s = this.texlength_s;
        material.texlength_t = this.texlength_t;

        // Apply texture repeat settings based on scale factors
        if (material.map) {
            material.map.wrapS = THREE.RepeatWrapping;
            material.map.wrapT = THREE.RepeatWrapping;

            // Set initial repeat to 1 (this will be adjusted later)
            material.map.repeat.set(1, 1);
        }

        return material;
    }
}

export { MyMaterials };
