import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

THREE.ColorManagement.enabled = false

//Debug
const gui = new dat.GUI()

//Canvas
const canvas = document.querySelector('canvas.webgl')

//Scene
const scene = new THREE.Scene()

const axesHelper = new THREE.AxesHelper(1)
scene.add(axesHelper)

//Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
        color: "#777777",
        metalness: 0.3,
        roughness: 0.4
    })
)

floor.receiveShadow = true
floor.rotation.x = -Math.PI * 0.5
scene.add(floor)

//Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

//Sizing
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 50)
camera.position.set(-30, 2, 0)
scene.add(camera)

//Mouse move
const mouse = {}

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
})

//Physics
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, -9.82, 0)

const defaultMaterial = new CANNON.Material('default')

const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.3
    }
)
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial

const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
world.addBody(floorBody)


//Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.maxDistance = 30
controls.minDistance = 30
controls.minPolarAngle = Math.PI * 0.45
controls.maxPolarAngle = Math.PI * 0.45
controls.enablePan = false

//Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})

renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//shoot cannonballs
//get velocity to work, click direction for x and y + z direction velocty
window.addEventListener('click', () => {
    let direction = new THREE.Vector3()
    const dist = 1
    camera.getWorldDirection(direction)
    direction.multiplyScalar(dist)
    direction.add(camera.position)

    //mouse is -1, 1 top left, 1, 1 top right, -1, -1 bottom left, 1, -1 bottom right, not absolute position on screen...

    createSphere(0.5, {x: direction.x, y: direction.y, z: direction.z}, mouse)
    // console.log(direction)
})

//utils
const objectsToUpdate = []
const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4
})

const createSphere = (radius, position, mouse) => {
    const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
    mesh.scale.set(radius, radius, radius)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    const shape = new CANNON.Sphere(radius)
    const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 3, 0),
        shape,
        material: defaultMaterial
    })
    body.position.copy(position)
    const isX = Math.abs(position.x) < Math.abs(position.z)
    const isCorner = Math.abs(position.x) > 5 && Math.abs(position.z) > 5
    const scale = 1.2

    if (isCorner) {
        if (position.x < 0 && position.z > 0) {
            body.applyLocalForce(new CANNON.Vec3(- (position.x) * 50 + (mouse.x * window.innerWidth * scale), mouse.y * window.innerHeight * scale, - (position.z) * 50 + (mouse.x * window.innerWidth * scale)))
        } else if (position.x > 0 && position.z > 0) {
            body.applyLocalForce(new CANNON.Vec3(- (position.x) * 50 + (mouse.x * window.innerWidth * scale), mouse.y * window.innerHeight * scale, - (position.z) * 50 - (mouse.x * window.innerWidth * scale)))
        } else if (position.x > 0 && position.z < 0) {
            body.applyLocalForce(new CANNON.Vec3(- (position.x) * 50 - (mouse.x * window.innerWidth * scale), mouse.y * window.innerHeight * scale, - (position.z) * 50 - (mouse.x * window.innerWidth * scale)))
        } else {
            body.applyLocalForce(new CANNON.Vec3(- (position.x) * 50 - (mouse.x * window.innerWidth * scale), mouse.y * window.innerHeight * scale, - (position.z) * 50 + (mouse.x * window.innerWidth * scale)))
        }
    } else {
        if (isX) {
            if (position.x < 0) {
                body.applyLocalForce(new CANNON.Vec3(mouse.x * window.innerWidth * scale, mouse.y * window.innerHeight * scale, -(position.z) * 50))
            } else {
                body.applyLocalForce(new CANNON.Vec3(- mouse.x * window.innerWidth * scale, mouse.y * window.innerHeight * scale, -(position.z) * 50))
            }
        } else {
            if (position.x < 0) {
                body.applyLocalForce(new CANNON.Vec3(-(position.x) * 50, mouse.y * window.innerHeight * scale, mouse.x * window.innerWidth * scale))
            } else {
                body.applyLocalForce(new CANNON.Vec3(-(position.x) * 50, mouse.y * window.innerHeight * scale, - mouse.x * window.innerWidth * scale))
            }
        }
    }
    // console.log(isX)

    world.addBody(body)

    objectsToUpdate.push({
        mesh: mesh,
        body: body
    })
}

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

const createBox = (width, height, depth, position, color) => {
    const boxMaterial = new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        color: color
    })
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))
    const body = new CANNON.Body({
        mass: 0.1,
        position: new CANNON.Vec3(),
        shape,
        material: defaultMaterial,
        type: CANNON.Body.STATIC
        })
    body.addEventListener('collide', () => {
        body.type = CANNON.Body.DYNAMIC
    })
    body.sleepSpeedLimit = 2
    body.position.copy(position)
    world.addBody(body)

    objectsToUpdate.push({
        mesh: mesh,
        body: body
    })
}

//pixel art constants
//Mac
const black = "#000000"
const white = "#ffffff"
const brown = "#38190c"
const skin1 = "#fac0aa"
const salmon = "#c75056"
const blue = "#4c769e"
const purple = "#958da1"
const macColors = [[black, black, black, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, purple, purple, purple, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, white, white],
[black, purple, purple, purple, purple, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, black, black, brown, brown, black, white, white],
[black, purple, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, skin1, skin1, black, black, black, brown, black, black, black, white],
[black, purple, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, white, black, skin1, skin1, skin1, skin1, skin1, black, brown, brown, black, salmon, salmon, black, black],
[black, purple, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, black, black, black, skin1, skin1, black, black, black, brown, brown, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, black, black, white, white, white, white, white, black, black, black, black, black, skin1, skin1, skin1, black, black, brown, brown, brown, black, salmon, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, purple, black, white, white, white, white, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, black, black, brown, black, salmon, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, purple, black, black, white, white, black, black, skin1, skin1, skin1, skin1, skin1, skin1, brown, brown, skin1, skin1, skin1, black, black, black, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, black, black, black, black, black, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, brown, brown, skin1, skin1, black, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, black, black, skin1, skin1, black, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, brown, brown, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, black, black, skin1, skin1, black, black, skin1, skin1, skin1, black, skin1, skin1, skin1, skin1, skin1, blue, blue, brown, brown, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, black, black, skin1, skin1, skin1, black, skin1, skin1, black, black, black, skin1, skin1, skin1, skin1, skin1, blue, blue, brown, brown, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, black, skin1, skin1, skin1, black, black, skin1, black, white, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, brown, skin1, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, black, skin1, skin1, skin1, black, skin1, skin1, black, white, black, skin1, skin1, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, black, skin1, skin1, skin1, black, skin1, skin1, black, white, black, skin1, black, skin1, skin1, skin1, black, black, skin1, skin1, skin1, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, black, skin1, skin1, skin1, black, black, skin1, black, white, black, skin1, black, skin1, skin1, black, skin1, skin1, skin1, skin1, skin1, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, black, skin1, skin1, skin1, skin1, black, black, skin1, black, black, skin1, skin1, black, black, skin1, skin1, skin1, skin1, brown, skin1, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, black, black, black, skin1, skin1, skin1, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, blue, blue, brown, brown, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, black, black, black, black, black, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, blue, blue, brown, brown, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, purple, black, black, white, black, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, skin1, brown, brown, black, salmon, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, purple, black, white, white, white, black, black, skin1, skin1, skin1, skin1, skin1, skin1, skin1, brown, brown, skin1, black, black, salmon, salmon, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, black, black, white, white, white, white, black, black, skin1, skin1, skin1, skin1, skin1, skin1, brown, skin1, skin1, black, black, black, black, black, salmon, salmon, salmon, black],
[black, purple, purple, purple, purple, purple, black, white, white, white, white, white, white, white, black, black, black, black, black, skin1, skin1, skin1, skin1, skin1, black, black, brown, brown, black, salmon, salmon, black],
[black, purple, purple, purple, purple, black, black, white, white, white, white, white, white, white, white, white, white, white, black, black, skin1, skin1, skin1, black, brown, brown, brown, brown, black, black, black, black],
[black, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, black, black, black, brown, brown, brown, black, black, white],
[black, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, black, white, white],
[black, purple, purple, purple, purple, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, purple, purple, purple, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, black, black, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white]]

//Tony
const skin2 = "#ffcf87"
const pink = "#ffa3b1"

const tonyColors = [[black, black, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, pink, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, white, white],
[black, pink, pink, pink, pink, pink, black, black, white, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, white, black, black, black, black, black, black, black],
[black, pink, pink, pink, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, black, black, skin2, skin2, black, black, black, black, black, black, black, black, black],
[black, pink, pink, pink, pink, pink, pink, black, black, white, white, white, white, white, white, white, white, black, black, black, skin2, skin2, skin2, skin2, black, black, black, black, black, black, black, black],
[black, pink, pink, pink, pink, pink, black, black, pink, black, white, white, white, white, black, black, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, black, black, black, black, black, black, black],
[black, pink, pink, pink, pink, black, black, pink, pink, black, black, white, white, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, black, skin2, black, black, black, black, black, black, black, black],
[black, pink, pink, pink, black, black, pink, pink, pink, pink, black, black, black, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, black, black, black, black, black, black, black, black, black],
[black, pink, pink, pink, black, pink, pink, pink, black, black, skin2, black, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, black, black, black, skin2, black, black, black, black, black, black, black],
[black, pink, pink, pink, black, pink, pink, black, black, skin2, black, black, skin2, black, black, skin2, skin2, skin2, skin2, skin2, black, black, black, black, skin2, black, black, black, black, black, black, black],
[black, pink, pink, pink, black, pink, black, black, skin2, skin2, black, skin2, black, white, black, skin2, skin2, black, black, skin2, skin2, skin2, black, skin2, skin2, black, black, black, black, black, black, black],
[black, pink, pink, pink, pink, black, black, skin2, skin2, black, black, skin2, black, white, black, skin2, black, skin2, skin2, black, black, black, skin2, skin2, skin2, skin2, black, black, black, black, black, black],
[black, pink, pink, pink, pink, pink, black, skin2, skin2, black, skin2, skin2, black, white, black, skin2, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, black, black, black, black],
[black, pink, pink, pink, pink, pink, black, black, skin2, black, skin2, skin2, black, white, black, skin2, black, skin2, skin2, skin2, skin2, skin2, black, skin2, skin2, skin2, skin2, black, black, black, black, black],
[black, pink, pink, pink, black, black, pink, black, skin2, black, black, skin2, black, white, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, black, skin2, skin2, skin2, black, black, black, black, black],
[black, pink, pink, pink, black, pink, pink, black, black, skin2, black, black, skin2, black, black, skin2, skin2, skin2, skin2, skin2, black, black, black, black, skin2, skin2, black, black, black, black, black, black],
[black, pink, pink, pink, black, pink, pink, pink, black, black, skin2, black, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, black, black, black, skin2, black, black, black, black, black, black, black],
[black, pink, pink, pink, black, black, pink, pink, pink, black, skin2, black, black, black, skin2, skin2, skin2, skin2, skin2, skin2, skin2, skin2, black, skin2, black, black, black, black, black, black, black, black],
[black, pink, pink, pink, pink, black, black, pink, pink, black, black, white, white, black, black, skin2, skin2, skin2, skin2, skin2, skin2, black, black, skin2, black, black, black, black, black, black, black, white],
[black, pink, pink, pink, pink, pink, black, black, pink, black, white, white, white, white, black, black, black, black, black, black, black, skin2, skin2, skin2, black, black, black, black, black, black, black, white],
[black, pink, pink, pink, pink, pink, pink, black, black, white, white, white, white, white, white, white, white, white, white, black, black, skin2, skin2, skin2, black, black, black, black, black, black, black, white],
[black, pink, pink, pink, pink, pink, black, black, white, white, white, white, white, white, white, white, white, white, white, white, black, black, black, black, black, black, black, black, black, black, white, white],
[black, pink, pink, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, pink, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, pink, pink, pink, pink, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],
[black, black, black, black, black, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white, white],]

const createTonyWall = () => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            console.log(macColors[x][y])
            createBox(0.5, 0.5, 0.5, {x: 0, y: y / 2, z: (x / 2) - 8}, tonyColors[x][y])
        }
    }
}

const createMacWall = () => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            createBox(0.5, 0.5, 0.5, {x: 0, y: y / 2, z: (x / 2) - 8}, macColors[x][y])
        }
    }
}

createTonyWall()

//Animate
const clock = new THREE.Clock()
let oldElapsedTime = 0
const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    const deltaTime = elapsedTime - oldElapsedTime 
    oldElapsedTime = elapsedTime

    world.step(1/60, deltaTime, 3)

    for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
    }

    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()

