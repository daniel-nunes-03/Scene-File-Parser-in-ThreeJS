import * as THREE from 'three';
import { MyValidationUtils } from '../utils/MyValidationUtils.js';

/**
 * Class representing a texture in the application.
 * Handles loading of single textures, custom mipmaps, and video textures.
 */
class MyTextures {
    /**
     * Creates an instance of MyTextures.
     * @param {String} textureId - The unique identifier for the texture.
     * @param {Object} textureData - An object containing texture properties and paths.
     */
    constructor(textureId, textureData = {}) {
        this.validator = new MyValidationUtils();

        this.textureId = this.validator.validateString(textureId);
        this.filepath = this.validator.validateString(textureData.filepath);
        this.isVideo = this.validator.parseBoolean(textureData.isVideo);
        this.mipmaps = [];

        // Collect mipmaps if specified, up to level 7
        for (let i = 0; i <= 7; i++) {
            const mipmapKey = `mipmap${i}`;
            const mipmapPath = this.validator.validateString(textureData[mipmapKey]);
            if (mipmapPath) {
                this.mipmaps.push(mipmapPath);
            } else {
                // Stop if a mipmap level is missing or invalid
                break;
            }
        }
    }

    /**
     * Asynchronously loads the texture based on its type.
     * Handles video textures, custom mipmaps, or single textures.
     * @async
     * @returns {Promise<THREE.Texture|null>} - The loaded THREE.Texture or null if failed.
     */
    async loadTextureAsync() {
        if (this.isVideo && this.filepath) {
            // Handle video textures
            return this.loadVideoTexture();
        } else if (this.mipmaps.length > 0) {
            // Load mipmaps if available
            return this.loadCustomMipmaps();
        } else if (this.filepath) {
            // Fallback to single texture with automatic mipmaps
            return this.loadSingleTexture();
        } else {
            console.warn("Invalid filepath or mipmaps. Texture not loaded.");
            return null;
        }
    }

    /**
     * Asynchronously loads a single texture from the specified filepath.
     * @async
     * @returns {Promise<THREE.Texture>} - The loaded THREE.Texture.
     */
    async loadSingleTexture() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                this.filepath,
                texture => {
                    // On successful load, configure the texture
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipMapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    resolve(texture);
                },
                // No progress callback
                undefined,
                error => {
                    // On error, log and reject the promise
                    console.error(`Failed to load texture at path: ${this.filepath}`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Asynchronously loads custom mipmaps and creates a texture.
     * Mipmaps are loaded from specified filepaths and assigned to the texture.
     * @async
     * @returns {Promise<THREE.Texture|null>} - The loaded THREE.Texture or null if failed.
     */
    async loadCustomMipmaps() {
        const loader = new THREE.TextureLoader();

        // Create an array of promises to load each mipmap level
        const mipmapPromises = this.mipmaps.map(mipmapPath => 
            new Promise((resolve, reject) => {
                loader.load(
                    mipmapPath,
                    // Resolve with the image object
                    texture => resolve(texture.image),
                    // No progress callback
                    undefined,
                    // On error, reject the promise
                    error => reject(error)
                );
            })
        );

        try {
            // Wait for all mipmap images to load
            const images = await Promise.all(mipmapPromises);

            if (images.length === 0) {
                console.error("No mipmap images loaded.");
                return null;
            }

            // Create a new texture and assign the base image and mipmaps
            const texture = new THREE.Texture();
            // Set the highest resolution image as the base
            texture.image = images[0];
            // Assign remaining images as mipmaps
            texture.mipmaps = images.slice(1);

            // Configure texture filtering and mipmap generation
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            // Disable automatic mipmap generation, since it uses custom mipmaps
            texture.generateMipmaps = false;

            // Optionally, set the texture format and encoding if needed
            // texture.format = THREE.RGBFormat;
            // texture.encoding = THREE.sRGBEncoding;

            texture.needsUpdate = true;

            return texture;
        } catch (error) {
            console.error("Error loading mipmaps:", error);
            // Fallback to single texture if mipmap loading fails
            return this.loadSingleTexture();
        }
    }

    /**
     * Loads a video texture from the specified filepath.
     * @returns {Promise<THREE.VideoTexture>} - The loaded THREE.VideoTexture.
     */
    loadVideoTexture() {
        return new Promise(resolve => {
            // Create a video element to load the video file
            const video = document.createElement('video');
            video.src = this.filepath;
            video.loop = true;
            video.muted = true;
            video.autoplay = true;
            // Handle cross-origin if needed (for different browsers)
            video.crossOrigin = "anonymous";
            video.load();

            // Wait for the video data to be loaded
            video.addEventListener('loadeddata', () => {
                // Attempt to play the video
                video.play().catch(error => {
                    console.warn("Video playback failed:", error);
                });

                // Create a VideoTexture from the video element
                const texture = new THREE.VideoTexture(video);
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.format = THREE.RGBAFormat;

                resolve(texture);
            });
        });
    }
}

export { MyTextures };
