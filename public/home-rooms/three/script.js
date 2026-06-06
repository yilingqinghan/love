import * as THREE from "../../assets/vendor/three/three.module.js";
import { OrbitControls } from "../../assets/vendor/three/OrbitControls.js";
import { GLTFLoader } from "../../assets/vendor/three/GLTFLoader.js";

const canvas = document.querySelector('.webgl')
const scene = new THREE.Scene()
const textureLoader = new THREE.TextureLoader()
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Base camera
const camera = new THREE.PerspectiveCamera(10, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 18
camera.position.y = 8
camera.position.z = 20
scene.add(camera)

//Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enableZoom = false
controls.enablePan = false
controls.minDistance = 20
controls.maxDistance = 40
controls.minPolarAngle = Math.PI / 4
controls.maxPolarAngle = Math.PI / 2
controls.minAzimuthAngle = - Math.PI / 80
controls.maxAzimuthAngle = Math.PI / 2.5

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000, 0)

// Materials
const bakedTexture = textureLoader.load('../../assets/home-rooms/three/baked.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture,
    side: THREE.DoubleSide,
})

//Loader
const loader = new GLTFLoader()
loader.load('../../assets/home-rooms/three/model.glb',
    (gltf) => {
        const model = gltf.scene
        model.traverse( child => child.material = bakedMaterial )
        model.rotation.y = -0.36
        scene.add(model)
    },
    ( xhr ) => {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
    }
)


window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
// Animation
const tick = () => {
    controls.update()
    scene.rotation.y += 0.0015
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()
