import * as THREE from 'three';
import { NURBSSurface } from 'three/addons/curves/NURBSSurface.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

/**
 *  This class contains the contents of out application
 */

class MyNurbsBuilder  {
    /**
       constructs the object
       @param {MyApp} app The application object
    */
    constructor(app) {
        this.app = app
    }

    build(controlPoints, degree1, degree2, samples1, samples2) {
        const knots1 = []
        const knots2 = []

        // Build knots1
        for (let i = 0; i <= degree1; i++) knots1.push(0);
        for (let i = 0; i <= degree1; i++) knots1.push(1);

        // Build knots2
        for (let i = 0; i <= degree2; i++) knots2.push(0);
        for (let i = 0; i <= degree2; i++) knots2.push(1);

        const stackedPoints = controlPoints.map(row =>
            row.map(item => new THREE.Vector4(item[0], item[1], item[2], item[3]))
        );

        const nurbsSurface = new NURBSSurface(degree1, degree2, knots1, knots2, stackedPoints);

        const geometry = new ParametricGeometry((u, v, target) => {
            nurbsSurface.getPoint(u, v, target);
        }, samples1, samples2);

        return geometry;
    }
}

export { MyNurbsBuilder };
