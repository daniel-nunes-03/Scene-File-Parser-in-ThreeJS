import * as THREE from 'three';

/**
 * Applies a material to all meshes within a given node group.
 * @param {THREE.Object3D} node - The node to apply the material to.
 * @param {THREE.Material} material - The material to apply.
 * @param {Boolean} parentCastShadow - Whether the parent node casts shadows.
 * @param {Boolean} parentReceiveShadow - Whether the parent node receives shadows.
 */
function applyMaterialToNode(node, material, parentCastShadow = false, parentReceiveShadow = false) {
    node.traverse(child => {
        if (child.isMesh) {
            child.material = material;

            // Set shadow properties based on the node's values
            child.castShadow = parentCastShadow || child.castShadow;
            child.receiveShadow = parentReceiveShadow || child.receiveShadow;
        }
    });
}

export { applyMaterialToNode };
