import * as THREE from 'three';
import { MyValidationUtils } from './utils/MyValidationUtils.js';
import { applyMaterialToNode } from './utils/MyMaterialUtils.js';
import { applyTransformations } from './utils/MyTransformUtils.js';
import { createPrimitive } from './utils/MyPrimitiveUtils.js';
import { createLight } from './utils/MyLightUtils.js';

class GraphParser {
    constructor(materials, textures, appMyContents) {
        this.materials = materials;
        this.textures = textures;
        this.nodes = {};
        // Track processed node IDs and parent materials
        this.processedNodes = new Map();

        // Reference to MyContents to get default material
        this.appMyContents = appMyContents;

        this.validator = new MyValidationUtils();

        /**
         * IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN
        
        // New property to store transformation history
        this.transformHistory = {};
        
        */
    }

    /**
     * Parse and render the "graph" structure into the scene.
     * @param {Object} graphData - The graph data from YASF.
     */
    parseGraph(graphData, scene) {
        this.scene = scene;

        if (!graphData || !graphData.rootid) {
            console.warn("Root node ID not found in the graph data.");
            return;
        }

        this.rootNodeId = graphData.rootid;
        console.info("Processing graph structure...");
        
        // Process the root node
        const rootNode = this.createNode(graphData, this.rootNodeId);
        if (rootNode) {
            this.scene.add(rootNode);
        } else {
            console.warn(`Root node '${this.rootNodeId}' could not be created.`);
        }
    }

    /**
     * Recursive function to create nodes, including applying transformations,
     * setting materials, handling shadows, and creating/cloning groups.
     * @param {Object} graphData - The entire graph data.
     * @param {String} nodeId - The ID of the current node.
     * @param {THREE.Material} parentMaterial - The material to inherit if not specified on the node.
     * @param {Boolean} parentCastShadow - Whether the parent node casts shadows.
     * @param {Boolean} parentReceiveShadow - Whether the parent node receives shadows.
     * @param {Object} parentTransform - The geometric transformations in a given node's structure so far.
     * parentTransform - IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN
     * @returns {THREE.Group} - The created node group.
     */
    createNode(
        graphData,
        nodeId,
        parentMaterial = null,
        parentCastShadow = false,
        parentReceiveShadow = false,
        /*parentTransform = null - IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN */
    ) {
        // Create a unique cache key based on nodeId and parentMaterial UUID
        const materialUUID = parentMaterial ? parentMaterial.uuid : 'null';
        const cacheKey = `${nodeId}_${materialUUID}`;

        // Skip already processed nodes with the same parentMaterial.
        // If a node is reused with a different material, it will be processed again,
        // and the material will be correctly applied.
        if (this.processedNodes.has(cacheKey)) {
            return this.nodes[cacheKey];
        }

        const nodeData = graphData[nodeId];

        if (!nodeData) {
            console.warn(`Node data for '${nodeId}' is missing in graphData.`);
            return null;
        }

        // Create a group for the node
        const group = new THREE.Group();

        /**
         * IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN
        
        let currentTransform = parentTransform || {
            translate: new THREE.Vector3(0, 0, 0),
            rotate: new THREE.Vector3(0, 0, 0),
            scale: new THREE.Vector3(1, 1, 1),
        };

        */

        // Apply transformations if available
        if (nodeData.transforms) {
            applyTransformations(group, nodeData.transforms);

            /**
             * IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN
            
            const transformations = applyTransformations(group, nodeData.transforms);

            // Update the current transformations cumulatively
            currentTransform = {
                translate: currentTransform.translate.clone().add(transformations.translation),
                rotate: currentTransform.rotate.clone().add(transformations.rotation),
                scale: currentTransform.scale.clone().multiply(transformations.scale),
            };

            */
        }
        
        /**
         * IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN
        
        // Save the transformation history
        this.transformHistory[nodeId] = currentTransform;
        
        */

        // Handle material if provided
        // Default to parent material if not specified
        let nodeMaterial = parentMaterial;
        if (nodeData.materialref?.materialId) {
            const materialId = nodeData.materialref.materialId;
            nodeMaterial = this.materials[materialId] || parentMaterial;
        }

        // Store material in userData for future reference
        group.userData.material = nodeMaterial;

        // Determine shadow properties
        const nodeCastShadow = this.validator.parseBoolean(parentCastShadow) 
            || this.validator.parseBoolean(nodeData.castshadow);
        const nodeReceiveShadow = this.validator.parseBoolean(parentReceiveShadow) 
            || this.validator.parseBoolean(nodeData.receiveshadow);

        // Set shadow properties
        group.castShadow = nodeCastShadow;
        group.receiveShadow = nodeReceiveShadow;

        // Handle children: primitives/lights, nodesList, and lodsList
        if (nodeData.children) {
            // Process direct children (excluding nodesList and lodsList)
            for (const childId in nodeData.children) {
                if (childId === "nodesList" || childId === "lodsList") continue;

                let childData = nodeData.children[childId];

                // Create a new childData object with nodeId.
                // This is needed for lights appearing correctly in the GUI.
                if (!childData.nodeId) {
                    childData = { ...childData, nodeId: childId };
                }

                this.handleChild(
                    group,
                    childData,
                    graphData,
                    nodeMaterial,
                    nodeCastShadow,
                    nodeReceiveShadow,
                );
            }

            // Process nodes in nodesList
            if (Array.isArray(nodeData.children.nodesList)) {
                for (const childNodeId of nodeData.children.nodesList) {
                    this.handleChild(
                        group,
                        { type: "noderef", nodeId: childNodeId }, // childData
                        graphData,
                        nodeMaterial,
                        nodeCastShadow,
                        nodeReceiveShadow
                    );
                }
            }

            // Process LODs in lodsList
            if (Array.isArray(nodeData.children.lodsList)) {
                for (const lodNodeId of nodeData.children.lodsList) {
                    const lod = this.createLOD(
                        graphData,
                        graphData[lodNodeId],
                        nodeMaterial,
                        nodeCastShadow,
                        nodeReceiveShadow
                    );
                    if (lod) {
                        group.add(lod);
                    }
                }
            }
        }

        // Cache the group for this node ID and parentMaterial
        this.processedNodes.set(cacheKey, true);
        this.nodes[cacheKey] = group;
        
        return group;
    }

    /**
     * Creates a THREE.LOD object based on lodsList in the node data.
     * @param {Object} graphData - The graph data.
     * @param {Object} lodData - The LOD data.
     * @param {THREE.Material} parentMaterial - The parent material.
     * @param {Boolean} parentCastShadow - Whether the parent node casts shadows.
     * @param {Boolean} parentReceiveShadow - Whether the parent node receives shadows.
     * @returns {THREE.LOD|null} - The created LOD object or null if invalid.
     */
    createLOD(graphData, lodData, parentMaterial, parentCastShadow, parentReceiveShadow) {
        if (!lodData?.lodNodes) {
            console.warn(`Invalid LOD data: ${JSON.stringify(lodData)}`);
            return null;
        }

        const lod = new THREE.LOD();

        // Apply transformations if available
        if (lodData.transforms) {
            applyTransformations(lod, lodData.transforms);
        }

        // Process each LOD level
        for (const lodEntry of lodData.lodNodes) {
            const { nodeId, mindist } = lodEntry;

            if (!nodeId || typeof mindist !== "number") {
                console.warn(`Invalid LOD entry: ${JSON.stringify(lodEntry)}`);
                continue;
            }

            const lodChild = this.createNode(
                graphData,
                nodeId,
                parentMaterial,
                parentCastShadow,
                parentReceiveShadow
            );

            if (lodChild) {
                lod.addLevel(lodChild, mindist);
            } else {
                console.warn(`LOD child '${nodeId}' could not be created.`);
            }
        }

        return lod;
    }

    /**
     * Handles each child in a node, such as primitives, lights, and node references.
     * @param {THREE.Group} group - The parent group.
     * @param {Object} childData - The child data from the graph.
     * @param {Object} graphData - The entire graph data.
     * @param {THREE.Material} parentMaterial - The material to inherit if not specified on the child.
     * @param {Boolean} parentCastShadow - Whether the parent node casts shadows.
     * @param {Boolean} parentReceiveShadow - Whether the parent node receives shadows.
     * @param {Object} parentTransform - The geometric transformations in a given node's structure so far.
     * parentTransform - IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN
     * @returns {THREE.Object3D} - The created child node or primitive.
     */
    handleChild(
        group,
        childData,
        graphData,
        parentMaterial,
        parentCastShadow,
        parentReceiveShadow,
        /*parentTransform - IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN */
    ) {
        const type = childData.type;
    
        if (type === "lod") {
            const lod = this.createLOD(graphData, childData, parentMaterial, parentCastShadow, parentReceiveShadow);
            if (lod) {
                group.add(lod);
            }
        } else if (type === "noderef") {
            if (!childData.nodeId) {
                console.warn(`Node reference missing 'nodeId' property.`);
                return;
            }

            /**
             * Retrieving the Node: createNode retrieves or creates the referenced node, like box, 
             * from the graph. The node from the example is referenced multiple times in the YASF graph.
             * 
             * Deep Clone for Independence: By using referencedNode.clone(true), a new copy of the 
             * node and all its children is created. This makes sure that GTs, materials, and other 
             * properties can be modified independently on each copy.
             */

            /**
             * IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN:

            // Retrieve or create the referenced node
            let referencedNode = this.createNode(
                graphData,
                childData.nodeId,
                parentMaterial,
                parentCastShadow,
                parentReceiveShadow,
                parentTransform
            );

            */

            // Retrieve or create the referenced node
            let referencedNode = this.createNode(
                graphData,
                childData.nodeId,
                parentMaterial,
                parentCastShadow,
                parentReceiveShadow
            );

            if (referencedNode) {
                // Clone the node for independent usage in this context
                const clonedNode = referencedNode.clone(true); // `true` to deep clone

                // Apply parent material if specified
                if (parentMaterial) {
                    applyMaterialToNode(clonedNode, parentMaterial, parentCastShadow, parentReceiveShadow);
                }

                group.add(clonedNode);
            }
        } else if (["rectangle", "triangle", "box", "cylinder", "sphere", "nurbs", "polygon"].includes(type)) {
            /**
             * IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN:
            
             const primitive = createPrimitive(childData, parentMaterial, this.appMyContents, parentTransform);

             */

            const primitive = createPrimitive(childData, parentMaterial, this.appMyContents);
            if (primitive) {
                primitive.castShadow = parentCastShadow || primitive.castShadow;
                primitive.receiveShadow = parentReceiveShadow || primitive.receiveShadow;

                group.add(primitive);
            }
        } else if (["pointlight", "spotlight", "directionallight"].includes(type)) {
            const lightGroup = createLight(childData, childData.nodeId || '');
            if (lightGroup) {
                group.add(lightGroup);
            }
        } else {
            console.warn(`Unknown child type '${type}' encountered.`);
        }
    }

    /**
     * Synchronize the visibility of a light group with its children.
     * Ensures that toggling the group visibility applies to the light and its target.
     * @param {THREE.Group} lightGroup - The group containing the light and its target.
     * @param {Boolean} visible - The desired visibility state.
     */
    synchronizeLightVisibility(lightGroup, visible) {
        // Update the group's visibility
        lightGroup.visible = visible;

        // Traverse through all children to update their visibility
        lightGroup.traverse((child) => {
            if (child.isLight || child.isObject3D) {
                child.visible = visible;
            }
        });
    }
}

export { GraphParser };
