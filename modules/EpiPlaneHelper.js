import { Line,  Mesh, LineBasicMaterial, MeshBasicMaterial, Float32BufferAttribute, BufferGeometry, FrontSide, BackSide, DoubleSide } from 'https://cdn.skypack.dev/three@0.130.1/build/three.module.js'

/**
 *	- based on threejs' PlaneHelper
 *		https://threejs.org/docs/#api/en/helpers/PlaneHelper
 *  - more control and less lines when compared to PlaneHelper
 */

class EpiPlaneHelper extends Line {

	constructor( plane, size = 1, hex = 0xffff00 ) {

		const color = hex;

		const positions = [  1, - 1, 1, 
						   - 1, - 1, 1, 
						   - 1,   1, 1, 
						     1,   1, 1,  1, - 1, 1 ]; // - 1, - 1, 1, 1, - 1, 1, 1, 1, 1 ];

		const geometry = new BufferGeometry();
		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.computeBoundingSphere();

		super( geometry, new LineBasicMaterial( { color: color, toneMapped: false } ) );

		this.type = 'EpiPlaneHelper';

		this.plane = plane;

		this.size = size;

		const positions2 = [ 1, 1, 1, - 1, 1, 1, - 1, - 1, 1, 1, 1, 1, - 1, - 1, 1, 1, - 1, 1 ];

		const geometry2 = new BufferGeometry();
		geometry2.setAttribute( 'position', new Float32BufferAttribute( positions2, 3 ) );
		geometry2.computeBoundingSphere();

		this.add( new Mesh( geometry2, new MeshBasicMaterial( { color: color, opacity: 0.2, transparent: true, depthWrite: false, toneMapped: false, side:  DoubleSide } ) ) );

	}

	updateMatrixWorld( force ) {

		let scale = - this.plane.constant;

		if ( Math.abs( scale ) < 1e-8 ) scale = 1e-8; // sign does not matter

		this.scale.set( 0.5 * this.size, 0.5 * this.size, scale );

		//this.children[ 0 ].material.side = ( scale < 0 ) ? BackSide : FrontSide; // renderer flips side when determinant < 0; flipping not wanted here

		this.lookAt( this.plane.normal );

		super.updateMatrixWorld( force );

	}

	dispose() {

		this.geometry.dispose();
		for( const child of this.children){
			if( 'geometry' in child) child.geometry.dispose();
			if( 'dispose' in child) child.dispose();
			
		}

	}

}

export { EpiPlaneHelper };
