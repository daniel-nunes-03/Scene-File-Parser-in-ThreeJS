import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

/**
 * This class customizes the GUI interface for the app.
 */
class MyGuiInterface  {

    /**
     * @param {MyApp} app - The application object.
     */
    constructor(app) {
        this.app = app;
        this.datgui = new GUI();
        this.contents = null;
        this.parser = null;

        // Store references to controllers for cameras and materials
        this.cameraController = null;
        this.materialSpecificControllers = {};

        // Inject custom CSS styles
        injectCustomStyles();
    }

    /**
     * Set the contents object.
     * @param {MyContents} contents - The contents object.
     */
    setContents(contents) {
        this.contents = contents;
        this.parser = this.contents.graphParser;
    }

    /**
     * Initialize the GUI interface.
     */
    init() {
        this.setupCamerasGUI();
        this.setupLightsGUI();
        this.setupMaterialsGUI();
    }

    /**
     * Sets up the cameras GUI.
     */
    setupCamerasGUI() {
        // Remove existing camera controller if it exists
        if (this.cameraController) {
            this.datgui.remove(this.cameraController);
            this.cameraController = null;
        }

        // Prepare camera names for the dropdown menu
        const cameraOptions = Object.keys(this.app.cameras);
        if (cameraOptions.length === 0) {
            console.warn("No cameras available to display in GUI.");
            return;
        }

        // Add a folder for cameras
        const cameraFolder = this.datgui.addFolder('Cameras');

        // Dropdown to select the active camera
        this.cameraController = cameraFolder
            .add(
                { activeCamera: this.app.activeCameraName || cameraOptions[0] },
                'activeCamera',
                cameraOptions
            )
            .name('Select Camera')
            .onChange((cameraName) => {
                this.app.setActiveCamera(cameraName);
            });

        cameraFolder.open();
    }

    /**
     * Sets up the lights-related GUI.
     */
    setupLightsGUI() {
        const lightFolder = this.datgui.addFolder("Lights");
    
        const lightGroups = new Set();

        this.app.scene.traverse((descendant) => {
            if (descendant.isLight) {
                // Get the parent group of the light (used to sync with the parser)
                const lightGroup = descendant.parent;
    
                // Ensure the light belongs to a valid group so it can be added to the list
                // of lights that will be rendered
                if (lightGroup && lightGroup.isGroup) {
                    lightGroups.add(lightGroup);
                }
            }
        });
    
        if (lightGroups.size > 0) {
            lightGroups.forEach((lightGroup) => {
                const lightName = lightGroup.children[0]?.name || "Unnamed Light";
                const truncatedName = truncateString(lightName, 40); // Truncate to 40 characters
                
                const controller = lightFolder
                    .add(lightGroup, "visible")
                    .name(truncatedName)
                    .onChange((value) => {
                        console.log(`Toggling visibility for ${lightName}:`, value);
                        // Sync visibility with the parser if the method exists
                        if (typeof this.parser?.synchronizeLightVisibility === 'function') {
                            this.parser.synchronizeLightVisibility(lightGroup, value);
                        }
                    });

                // Add tooltip with the full name to the element controller
                addTooltip(controller.domElement, lightName);
            });
        } else {
            lightFolder.add({ message: "No lights found" }, "message").name("No Lights");
        }
    
        lightFolder.open();
    }

    /**
     * Sets up the materials GUI.
     */
    setupMaterialsGUI() {
        // Setup general material controls for the wireframe toggle
        this.setupGeneralMaterialsGUI();
        // Setup specific material controls for the wireframe toggle
        this.setupSpecificMaterialsGUI();
    }

    /**
     * Sets up the general materials GUI.
     */
    setupGeneralMaterialsGUI() {
        const materialGeneralFolder = this.datgui.addFolder("General Materials Wireframe");

        // Add toggle for all wireframes
        materialGeneralFolder
            .add({ toggleAll: false }, "toggleAll")
            .name("Toggle All Wireframes")
            .onChange((value) => {
                // Update default material
                const defaultMaterial = this.contents.defaultMaterial;
                if (defaultMaterial && defaultMaterial.wireframe !== undefined) {
                    defaultMaterial.wireframe = value;
                    console.log(`Default Material wireframe set to:`, value);
                }
                
                // Update all materials and their controllers
                Object.keys(this.contents.materials).forEach((id) => {
                    const material = this.contents.materials[id];
                    if (material.wireframe !== undefined) {
                        material.wireframe = value;
                        console.log(`Material '${id}' wireframe set to:`, value);

                        // Update the individual material controller
                        const controller = this.materialSpecificControllers[id];
                        if (controller) {
                            controller.updateDisplay();
                        }
                    }
                });
            });

        materialGeneralFolder.open();
    }

    /**
     * Sets up the specific materials GUI
     */
    setupSpecificMaterialsGUI() {
        const materialSpecificFolder = this.datgui.addFolder("Individual Materials Wireframe");

        Object.keys(this.contents.materials).forEach((id) => {
            const material = this.contents.materials[id];
            if (material.wireframe !== undefined) {
                const truncatedId = truncateString(id, 25); // Truncate to 25 characters
                const controller = materialSpecificFolder
                    .add(material, "wireframe")
                    .name(`${truncatedId} - Wireframe`)
                    .onChange((value) => {
                        console.log(`Material '${id}' wireframe set to:`, value);
                    });

                // Add tooltip with the full name to the element controller
                addTooltip(controller.domElement, id);

                this.materialSpecificControllers[id] = controller;
            }
        });

        materialSpecificFolder.close();
    }
}

/**
 * Truncates a string to the specified length and adds ellipsis if needed.
 * @param {String} str - The string to truncate.
 * @param {Number} maxLength - The maximum length of the string.
 * @returns {String} - The truncated string.
 */
function truncateString(str, maxLength) {
    if (str.length > maxLength) {
        return str.substring(0, maxLength - 3) + '...';
    } else {
        return str;
    }
}

/**
 * Adds a tooltip to the specified DOM element.
 * @param {HTMLElement} element - The DOM element to add the tooltip to.
 * @param {String} text - The tooltip text.
 */
function addTooltip(element, text) {
    element.setAttribute('title', text);
}

/**
 * Injects custom CSS styles to handle text overflow in the GUI.
 */
function injectCustomStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* Ensure labels do not overflow and display ellipsis */
        .lil-gui .controller > label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
            display: inline-block;
            vertical-align: middle;
        }
    `;
    document.head.appendChild(style);
}

export { MyGuiInterface };
