import { Camera,  Vector3, LineSegments, Color, LineBasicMaterial, BufferGeometry, Float32BufferAttribute } from 'https://cdn.skypack.dev/three@0.130.1/build/three.module.js'

const _vector = /*@__PURE__*/ new Vector3();
const _camera = /*@__PURE__*/ new Camera();

/**
 *	- based on threejs' Camera Helper
 *		https://threejs.org/docs/#api/en/helpers/CameraHelper
 *  - more control and less lines when compared to CameraHelper
 */

class ImagePlaneHelper extends LineSegments {

	constructor( camera ) {

		const geometry = new BufferGeometry();
		const material = new LineBasicMaterial( { color: 0xffffff, vertexColors: true, toneMapped: false } );

		const vertices = [];
		const colors = [];

		const pointMap = {};

		// colors

		const colorFrustum = new Color( 0xffaa00 );
		const colorCone = new Color( 0xff0000 );
		const colorUp = new Color( 0x00aaff );
		const colorTarget = new Color( 0xffffff );
		const colorCross = new Color( 0x333333 );

		// near

		addLine( 'n1', 'n2', colorFrustum );
		addLine( 'n2', 'n4', colorFrustum );
		addLine( 'n4', 'n3', colorFrustum );
		addLine( 'n3', 'n1', colorFrustum );

		/*
		// far

		addLine( 'f1', 'f2', colorFrustum );
		addLine( 'f2', 'f4', colorFrustum );
		addLine( 'f4', 'f3', colorFrustum );
		addLine( 'f3', 'f1', colorFrustum );

		// sides

		addLine( 'n1', 'f1', colorFrustum );
		addLine( 'n2', 'f2', colorFrustum );
		addLine( 'n3', 'f3', colorFrustum );
		addLine( 'n4', 'f4', colorFrustum );
		*/

		// cone

		addLine( 'p', 'n1', colorCone );
		addLine( 'p', 'n2', colorCone );
		addLine( 'p', 'n3', colorCone );
		addLine( 'p', 'n4', colorCone );

		// up

		addLine( 'u1', 'u2', colorUp );
		addLine( 'u2', 'u3', colorUp );
		addLine( 'u3', 'u1', colorUp );

		// target

		//addLine( 'c', 't', colorTarget );
		addLine( 'p', 'c', colorCross );

		// cross

		addLine( 'cn1', 'cn2', colorCross );
		addLine( 'cn3', 'cn4', colorCross );

		//addLine( 'cf1', 'cf2', colorCross );
		//addLine( 'cf3', 'cf4', colorCross );

		function addLine( a, b, color ) {

			addPoint( a, color );
			addPoint( b, color );

		}

		function addPoint( id, color ) {

			vertices.push( 0, 0, 0 );
			colors.push( color.r, color.g, color.b );

			if ( pointMap[ id ] === undefined ) {

				pointMap[ id ] = [];

			}

			pointMap[ id ].push( ( vertices.length / 3 ) - 1 );

		}

		geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		super( geometry, material );

		this.type = 'CameraHelper';
		this.s = 1.0;

		this.camera = camera;
		if ( this.camera.updateProjectionMatrix ) this.camera.updateProjectionMatrix();

		this.matrix = camera.matrixWorld;
		this.matrixAutoUpdate = false;

		this.pointMap = pointMap;

		this.update();

	}

	update() {

		const geometry = this.geometry;
		const pointMap = this.pointMap;

		const w = 1, h = 1;

		// we need just camera projection matrix inverse
		// world matrix must be identity

		_camera.projectionMatrixInverse.copy( this.camera.projectionMatrixInverse );

		// determine scaling factor so we are independent of the near and far clipping planes
		_vector.set( 0, 0, -1 ).unproject( _camera );
		const s = 1.0 / Math.abs(_vector.z);


		// center / target

		setPoint( 'c', pointMap, geometry, _camera, 0, 0, - 1, s );
		setPoint( 't', pointMap, geometry, _camera, 0, 0, 1, s );

		// near

		setPoint( 'n1', pointMap, geometry, _camera, - w, - h, - 1, s );
		setPoint( 'n2', pointMap, geometry, _camera, w, - h, - 1, s );
		setPoint( 'n3', pointMap, geometry, _camera, - w, h, - 1, s  );
		setPoint( 'n4', pointMap, geometry, _camera, w, h, - 1, s );

		// far

		setPoint( 'f1', pointMap, geometry, _camera, - w, - h, 1, s );
		setPoint( 'f2', pointMap, geometry, _camera, w, - h, 1, s );
		setPoint( 'f3', pointMap, geometry, _camera, - w, h, 1, s );
		setPoint( 'f4', pointMap, geometry, _camera, w, h, 1, s );

		// up

		setPoint( 'u1', pointMap, geometry, _camera, w * 0.7, h * 1.1, - 1, s );
		setPoint( 'u2', pointMap, geometry, _camera, - w * 0.7, h * 1.1, - 1, s );
		setPoint( 'u3', pointMap, geometry, _camera, 0, h * 2, - 1 , s);

		// cross

		setPoint( 'cf1', pointMap, geometry, _camera, - w, 0, 1, s );
		setPoint( 'cf2', pointMap, geometry, _camera, w, 0, 1, s );
		setPoint( 'cf3', pointMap, geometry, _camera, 0, - h, 1, s );
		setPoint( 'cf4', pointMap, geometry, _camera, 0, h, 1, s );

		setPoint( 'cn1', pointMap, geometry, _camera, - w, 0, - 1, s );
		setPoint( 'cn2', pointMap, geometry, _camera, w, 0, - 1, s );
		setPoint( 'cn3', pointMap, geometry, _camera, 0, - h, - 1, s );
		setPoint( 'cn4', pointMap, geometry, _camera, 0, h, - 1, s );

		geometry.getAttribute( 'position' ).needsUpdate = true;

	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}


function setPoint( point, pointMap, geometry, camera, x, y, z, s = 1.0 ) {

	_vector.set( x, y, z ).unproject( camera ).multiplyScalar(s);

	const points = pointMap[ point ];

	if ( points !== undefined ) {

		const position = geometry.getAttribute( 'position' );

		for ( let i = 0, l = points.length; i < l; i ++ ) {

			position.setXYZ( points[ i ], _vector.x, _vector.y, _vector.z );

		}

	}

}

export { ImagePlaneHelper };
