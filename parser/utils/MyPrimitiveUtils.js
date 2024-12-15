import * as THREE from 'three';
import { MyNurbsBuilder } from './MyNurbsBuilder.js';
import { MyValidationUtils } from './MyValidationUtils.js';

/**
 * Create a primitive based on its type and properties, using the specified material if available.
 * @param {Object} primitiveData - The data for the primitive.
 * @param {THREE.Material} material - The material to use if no specific material reference is provided.
 * @param {Object} parentTransform - The geometric transformations in a given node's structure so far.
 * @param {*} appMyContents - Reference inherited by the parser to MyContents.js, to get the default material.
 * parentTransform - IF THERE IS EVER THE NEED TO GET THE TRANSFORM EXPLICITLY SHOWN
 * @returns {THREE.Mesh} - The created primitive mesh.
 */
function createPrimitive(primitiveData, material, appMyContents/*, parentTransform*/) {
    const validator = new MyValidationUtils();
    const type = primitiveData.type;
    let geometry;
    // Flag to indicate special texture handling
    let specialTextureHandling = false;

    // Variables for texlength_s and texlength_t
    let texlength_s = 1;
    let texlength_t = 1;

    // Ensure material is available and has texlength_s and texlength_t
    if (material && material.texlength_s && material.texlength_t) {
        texlength_s = material.texlength_s;
        texlength_t = material.texlength_t;
    }

    switch (type) {
        case "rectangle":
            const rectWidth = Math.abs(
                validator.toValidFloat(primitiveData.xy2?.x, 0.5) - validator.toValidFloat(primitiveData.xy1?.x, -0.5)
            );
            const rectHeight = Math.abs(
                validator.toValidFloat(primitiveData.xy2?.y, 0.5) - validator.toValidFloat(primitiveData.xy1?.y, -0.5)
            );
            geometry = new THREE.PlaneGeometry(rectWidth, rectHeight);

            // Calculate the midpoint of the rectangle to position it correctly
            const rectOffsetX = (validator.toValidFloat(primitiveData.xy1?.x, -0.5) 
                + validator.toValidFloat(primitiveData.xy2?.x, 0.5)) / 2;
            const rectOffsetY = (validator.toValidFloat(primitiveData.xy1?.y, -0.5) 
                + validator.toValidFloat(primitiveData.xy2?.y, 0.5)) / 2;

            // Translate the rectangle to align its vertices with xy1 and xy2
            // Z is zero since it's a 2D shape
            geometry.translate(rectOffsetX, rectOffsetY, 0);

            // Adjust UVs
            adjustRectangleUVs(geometry, texlength_s, texlength_t, rectWidth, rectHeight);
            break;

        case "triangle":
            // Extract and validate vertices
            const v1 = new THREE.Vector3(
                validator.toValidFloat(primitiveData.xyz1?.x, 0),
                validator.toValidFloat(primitiveData.xyz1?.y, 0),
                validator.toValidFloat(primitiveData.xyz1?.z, 0)
            );
            const v2 = new THREE.Vector3(
                validator.toValidFloat(primitiveData.xyz2?.x, 1),
                validator.toValidFloat(primitiveData.xyz2?.y, 0),
                validator.toValidFloat(primitiveData.xyz2?.z, 0)
            );
            const v3 = new THREE.Vector3(
                validator.toValidFloat(primitiveData.xyz3?.x, 0.5),
                validator.toValidFloat(primitiveData.xyz3?.y, 1),
                validator.toValidFloat(primitiveData.xyz3?.z, 0)
            );
        
            geometry = new THREE.BufferGeometry();

            // Add the vertex positions as a Float32Array attribute
            const triangle_positions = new Float32Array([
                v1.x, v1.y, v1.z,
                v2.x, v2.y, v2.z,
                v3.x, v3.y, v3.z
            ]);
            // Every 3 values in the array represent a single vertex (x, y, z).
            const groupingSize = 3;
            geometry.setAttribute("position", new THREE.BufferAttribute(triangle_positions, groupingSize));

            // Define the triangle face using indices
            // The vertices form one face
            const triangle_indices = [0, 1, 2];
            geometry.setIndex(triangle_indices);

            // Compute normals for proper lighting and shading
            geometry.computeVertexNormals();

            // Adjust UVs
            adjustTriangleUVs(geometry, v1, v2, v3, texlength_s, texlength_t);
            break;

        case "box":
            const boxWidth = Math.abs(
                validator.toValidFloat(primitiveData.xyz2?.x, 1) - validator.toValidFloat(primitiveData.xyz1?.x, -1)
            );
            const boxHeight = Math.abs(
                validator.toValidFloat(primitiveData.xyz2?.y, 1) - validator.toValidFloat(primitiveData.xyz1?.y, -1)
            );
            const boxDepth = Math.abs(
                validator.toValidFloat(primitiveData.xyz2?.z, 1) - validator.toValidFloat(primitiveData.xyz1?.z, -1)
            );
            const partsX = validator.toValidFloat(primitiveData.parts_x, 1);
            const partsY = validator.toValidFloat(primitiveData.parts_y, 1);
            const partsZ = validator.toValidFloat(primitiveData.parts_z, 1);
            geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth, partsX, partsY, partsZ);

            // Adjust the position of the box so xyz1 and xyz2 are its corners
            const offsetX = (validator.toValidFloat(primitiveData.xyz1?.x, -1) + validator.toValidFloat(primitiveData.xyz2?.x, 1)) / 2;
            const offsetY = (validator.toValidFloat(primitiveData.xyz1?.y, -1) + validator.toValidFloat(primitiveData.xyz2?.y, 1)) / 2;
            const offsetZ = (validator.toValidFloat(primitiveData.xyz1?.z, -1) + validator.toValidFloat(primitiveData.xyz2?.z, 1)) / 2;

            geometry.translate(offsetX, offsetY, offsetZ);

            // Adjust UVs
            adjustBoxUVs(geometry, texlength_s, texlength_t, boxWidth, boxHeight, boxDepth);
            break;

        case "cylinder":
            const topRadius = validator.toValidFloat(primitiveData.top, 1);
            const baseRadius = validator.toValidFloat(primitiveData.base, 1);
            const height = validator.toValidFloat(primitiveData.height, 2);
            const radialSegmentsCylinder = validator.toValidFloat(primitiveData.slices, 8);
            const heightSegmentsCylinder = validator.toValidFloat(primitiveData.stacks, 1);
            const closedCaps = validator.parseBoolean(primitiveData.capsclose);
            const thetaStart = validator.validateRadianAngle(primitiveData.thetaStart, 0);
            const thetaLength = validator.validateRadianAngle(primitiveData.thetaLength, 360);
            geometry = new THREE.CylinderGeometry(
                topRadius,
                baseRadius,
                height,
                radialSegmentsCylinder,
                heightSegmentsCylinder,
                closedCaps
            );
            geometry.parameters.thetaStart = thetaStart;
            geometry.parameters.thetaLength = thetaLength;

            // Adjust UVs
            adjustCylinderUVs(geometry, texlength_s, texlength_t, height, Math.max(topRadius, baseRadius));
            break;

        case "sphere":
            const radiusSphere = validator.toValidFloat(primitiveData.radius, 1);
            const widthSegmentsSphere = validator.toValidFloat(primitiveData.slices, 8);
            const heightSegmentsSphere = validator.toValidFloat(primitiveData.stacks, 6);
            const thetaStartSphere = validator.validateRadianAngle(primitiveData.thetastart, 0);
            const thetaLengthSphere = validator.validateRadianAngle(primitiveData.thetalength, 360);
            const phiStart = validator.validateRadianAngle(primitiveData.phistart, 0);
            const phiLength = validator.validateRadianAngle(primitiveData.philength, 180);
            geometry = new THREE.SphereGeometry(
                radiusSphere,
                widthSegmentsSphere,
                heightSegmentsSphere,
                thetaStartSphere,
                thetaLengthSphere,
                phiStart,
                phiLength
            );

            // Adjust UVs
            adjustSphereUVs(geometry, texlength_s, texlength_t);
            break;

        case "nurbs":
            const degreeU = validator.toValidFloat(primitiveData.degree_u, 3);
            const degreeV = validator.toValidFloat(primitiveData.degree_v, 3);
            const partsU = validator.toValidFloat(primitiveData.parts_u, 10);
            const partsV = validator.toValidFloat(primitiveData.parts_v, 10);

            // Parse control points
            const controlPoints = [];
            const numControlPoints = (degreeU + 1) * (degreeV + 1);
            const points = primitiveData.controlpoints || [];

            for (let i = 0; i < numControlPoints; i++) {
                const point = points[i] || {};
                const x = validator.toValidFloat(point.x, 0);
                const y = validator.toValidFloat(point.y, 0);
                const z = validator.toValidFloat(point.z, 0);
                if (!controlPoints[Math.floor(i / (degreeV + 1))]) {
                    controlPoints[Math.floor(i / (degreeV + 1))] = [];
                }
                controlPoints[Math.floor(i / (degreeV + 1))].push([x, y, z, 1]); // Default w = 1
            }

            // Use MyNurbsBuilder to generate the geometry
            const nurbsBuilder = new MyNurbsBuilder(appMyContents.app);
            geometry = nurbsBuilder.build(controlPoints, degreeU, degreeV, partsU, partsV);

            // Adjust UVs
            adjustNURBSUVs(geometry, texlength_s, texlength_t);
            break;

        case "polygon":
            const polygon_radius = validator.toValidFloat(primitiveData.radius, 1);
            const polygon_stacks = validator.toValidFloat(primitiveData.stacks, 3);
            const polygon_slices = validator.toValidFloat(primitiveData.slices, 5);
        
            // Validate colors
            const polygon_colorC = validator.parseColor(primitiveData.color_c ?? { r: 255, g: 255, b: 255 });
            const polygon_colorP = validator.parseColor(primitiveData.color_p ?? { r: 0, g: 0, b: 0 });
        
            // Arrays to store positions, colors, and indices
            const polygon_positions = [];
            const polygon_colors = [];
            const polygon_indices = [];
        
            // Generate vertices and colors
            for (let stack = 0; stack <= polygon_stacks; stack++) {
                const stackRadius = (stack / polygon_stacks) * polygon_radius;
        
                for (let slice = 0; slice <= polygon_slices; slice++) {
                    const theta = (slice / polygon_slices) * Math.PI * 2;
        
                    // Compute vertex position
                    const x = Math.cos(theta) * stackRadius;
                    const y = Math.sin(theta) * stackRadius;
                    const z = 0; // Polygon lies in XY plane
        
                    polygon_positions.push(x, y, z);
        
                    // Linearly interpolate colors between center and periphery
                    const t = stack / polygon_stacks;
                    const r = THREE.MathUtils.lerp(polygon_colorC.r, polygon_colorP.r, t);
                    const g = THREE.MathUtils.lerp(polygon_colorC.g, polygon_colorP.g, t);
                    const b = THREE.MathUtils.lerp(polygon_colorC.b, polygon_colorP.b, t);
                    polygon_colors.push(r, g, b);
                }
            }
        
            // Generate indices for triangles
            for (let stack = 0; stack < polygon_stacks; stack++) {
                for (let slice = 0; slice < polygon_slices; slice++) {
                    const current = stack * (polygon_slices + 1) + slice;
                    const next = current + polygon_slices + 1;
        
                    // First triangle of the quad
                    polygon_indices.push(current, next, current + 1);
        
                    // Second triangle of the quad
                    polygon_indices.push(next, next + 1, current + 1);
                }
            }
        
            // Create buffer geometry
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.Float32BufferAttribute(polygon_positions, 3));
            geometry.setAttribute("color", new THREE.Float32BufferAttribute(polygon_colors, 3));
            geometry.setIndex(polygon_indices);
        
            // Compute normals for lighting
            geometry.computeVertexNormals();

            // Use the inherited material if provided, ensuring it supports vertex colors
            let polygonMaterial;
            if (material) {
                // Clone the material to avoid modifying the original
                polygonMaterial = material.clone();
                polygonMaterial.vertexColors = true;
            } else {
                // No inherited material, clone the default material to avoid modidying the original
                polygonMaterial = appMyContents.defaultMaterialVertex.clone();
            }
            
            // Creating a unique ID for the Polygon to be added in MyContents.materials object
            let idBase = "polygon";
            let id = idBase + "_01";
            let counter = 1;

            // Check if the ID already exists in the materials object and increment if necessary
            while (appMyContents.materials[id]) {
                counter++;
                id = `${idBase}_${String(counter).padStart(2, '0')}`;
            }

            appMyContents.materials[id] = polygonMaterial;

            // Create the mesh
            return new THREE.Mesh(geometry, polygonMaterial);

        default:
            console.warn(`Unsupported primitive type: ${type}`);
    }

    if (geometry) {
        let meshMaterial;

        if (material) {
            meshMaterial = material;
        } else {
            // If no inherited material, clone the default material to avoid modidying the original,
            // and add it to the list of materials.
            meshMaterial = appMyContents.defaultMaterial.clone();

            // Creating a unique ID for the mesh to be added in MyContents.materials object
            let idBase = "default_mesh_material";
            let id = idBase + "_01";
            let counter = 1;

            // Check if the ID already exists in the materials object and increment if necessary
            while (appMyContents.materials[id]) {
                counter++;
                id = `${idBase}_${String(counter).padStart(2, '0')}`;
            }
            appMyContents.materials[id] = meshMaterial;
        }

        // Check if a texture map exists and apply specific scaling
        if (meshMaterial.map) {
            if (specialTextureHandling) {
                if (type === "triangle") {
                    // Special scaling for triangle
                    const positions = geometry.attributes.position.array;
                    const v1 = new THREE.Vector3(positions[0], positions[1], positions[2]);
                    const v2 = new THREE.Vector3(positions[3], positions[4], positions[5]);
                    const v3 = new THREE.Vector3(positions[6], positions[7], positions[8]);

                    const edge1 = v2.clone().sub(v1);
                    const edge2 = v3.clone().sub(v1);
                    const triangleArea = edge1.cross(edge2).length() / 2;

                    meshMaterial.map.repeat.set(
                        triangleArea / meshMaterial.texlength_s,
                        triangleArea / meshMaterial.texlength_t
                    );
                } else if (type === "nurbs") {
                    // Special scaling for NURBS
                    meshMaterial.map.repeat.set(
                        validator.toValidFloat(primitiveData.parts_u, 10) / meshMaterial.texlength_s,
                        validator.toValidFloat(primitiveData.parts_v, 10) / meshMaterial.texlength_t
                    );
                }
            } else {
                // General texture scaling for all other primitives
                geometry.computeBoundingBox();
                const boundingBox = geometry.boundingBox;

                if (boundingBox) {
                    const texScaleS = boundingBox.max.x - boundingBox.min.x;
                    const texScaleT = boundingBox.max.y - boundingBox.min.y;

                    meshMaterial.map.repeat.set(
                        texScaleS / meshMaterial.texlength_s || 1,
                        texScaleT / meshMaterial.texlength_t || 1
                    );
                }
            }

            meshMaterial.map.needsUpdate = true;
        }

        const mesh = new THREE.Mesh(geometry, meshMaterial);
        return mesh;
    }

    return null;
}

/**
 * Adjusts the UV coordinates of the rectangle geometry based on texlength_s and texlength_t.
 * @param {THREE.Geometry} geometry - The geometry to adjust.
 * @param {Number} texlength_s - The texture length in s direction.
 * @param {Number} texlength_t - The texture length in t direction.
 * @param {Number} width - The width of the rectangle.
 * @param {Number} height - The height of the rectangle.
 */
function adjustRectangleUVs(geometry, texlength_s, texlength_t, width, height) {
    const uvAttribute = geometry.attributes.uv;
    for (let i = 0; i < uvAttribute.count; i++) {
        const u = (uvAttribute.getX(i) * width) / texlength_s;
        const v = (uvAttribute.getY(i) * height) / texlength_t;
        uvAttribute.setXY(i, u, v);
    }
    uvAttribute.needsUpdate = true;
}

/**
 * Adjusts the UV coordinates of the triangle geometry based on texlength_s and texlength_t.
 * @param {THREE.BufferGeometry} geometry - The geometry to adjust.
 * @param {THREE.Vector3} v1 - First vertex of the triangle.
 * @param {THREE.Vector3} v2 - Second vertex of the triangle.
 * @param {THREE.Vector3} v3 - Third vertex of the triangle.
 * @param {Number} texlength_s - The texture length in s direction.
 * @param {Number} texlength_t - The texture length in t direction.
 */
function adjustTriangleUVs(geometry, v1, v2, v3, texlength_s, texlength_t) {
    // Compute edges
    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);

    // Compute lengths
    const length1 = edge1.length();
    const length2 = edge2.length();

    // Compute angle between edges
    const angle = edge1.angleTo(edge2);

    // Compute UVs
    const uvs = new Float32Array([
        0, 0, // v1
        length1 / texlength_s, 0, // v2
        (length2 * Math.cos(angle)) / texlength_s, (length2 * Math.sin(angle)) / texlength_t // v3
    ]);

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/**
 * Adjusts the UV coordinates of the box geometry based on texlength_s and texlength_t.
 * @param {THREE.BoxGeometry} geometry - The geometry to adjust.
 * @param {Number} texlength_s - The texture length in s direction.
 * @param {Number} texlength_t - The texture length in t direction.
 * @param {Number} width - The width of the box.
 * @param {Number} height - The height of the box.
 * @param {Number} depth - The depth of the box.
 */
function adjustBoxUVs(geometry, texlength_s, texlength_t, width, height, depth) {
    const uvAttribute = geometry.attributes.uv;

    // BoxGeometry has 6 sides and each side has its own UVs
    // The order of the faces is: px, nx, py, ny, pz, nz
    const faceSizes = [
        { u: depth, v: height }, // +X face
        { u: depth, v: height }, // -X face
        { u: width, v: depth },  // +Y face
        { u: width, v: depth },  // -Y face
        { u: width, v: height }, // +Z face
        { u: width, v: height }, // -Z face
    ];

    let uvIndex = 0;
    for (let face = 0; face < 6; face++) {
        const faceSize = faceSizes[face];
        for (let vertex = 0; vertex < 4; vertex++) {
            const u = uvAttribute.getX(uvIndex) * faceSize.u / texlength_s;
            const v = uvAttribute.getY(uvIndex) * faceSize.v / texlength_t;
            uvAttribute.setXY(uvIndex, u, v);
            uvIndex++;
        }
    }
    uvAttribute.needsUpdate = true;
}

/**
 * Adjusts the UV coordinates of the cylinder geometry based on texlength_s and texlength_t.
 * @param {THREE.CylinderGeometry} geometry - The geometry to adjust.
 * @param {Number} texlength_s - The texture length in s direction.
 * @param {Number} texlength_t - The texture length in t direction.
 * @param {Number} height - The height of the cylinder.
 * @param {Number} radius - The radius of the cylinder.
 */
function adjustCylinderUVs(geometry, texlength_s, texlength_t, height, radius) {
    const uvAttribute = geometry.attributes.uv;

    // Adjust UVs for side faces
    for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i) * (2 * Math.PI * radius) / texlength_s;
        const v = uvAttribute.getY(i) * height / texlength_t;
        uvAttribute.setXY(i, u, v);
    }
    uvAttribute.needsUpdate = true;
}

/**
 * Adjusts the UV coordinates of the sphere geometry based on texlength_s and texlength_t.
 * @param {THREE.SphereGeometry} geometry - The geometry to adjust.
 * @param {Number} texlength_s - The texture length in s direction.
 * @param {Number} texlength_t - The texture length in t direction.
 */
function adjustSphereUVs(geometry, texlength_s, texlength_t) {
    const uvAttribute = geometry.attributes.uv;

    for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i) / texlength_s;
        const v = uvAttribute.getY(i) / texlength_t;
        uvAttribute.setXY(i, u, v);
    }
    uvAttribute.needsUpdate = true;
}

/**
 * Adjusts the UV coordinates of the NURBS geometry based on texlength_s and texlength_t.
 * @param {THREE.BufferGeometry} geometry - The geometry to adjust.
 * @param {Number} texlength_s - The texture length in s direction.
 * @param {Number} texlength_t - The texture length in t direction.
 */
function adjustNURBSUVs(geometry, texlength_s, texlength_t) {
    const uvAttribute = geometry.attributes.uv;

    for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i) / texlength_s;
        const v = uvAttribute.getY(i) / texlength_t;
        uvAttribute.setXY(i, u, v);
    }
    uvAttribute.needsUpdate = true;
}

export { createPrimitive };
