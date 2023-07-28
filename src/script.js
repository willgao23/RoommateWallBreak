import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

THREE.ColorManagement.enabled = false

//Debug
const gui = new dat.GUI({autoPlace: false})
gui.domElement.id = 'gui'
document.getElementById("gui_container").appendChild(gui.domElement)
const debugObject = {}
const reset = () => {
    for (const object of objectsToUpdate) {
        world.removeBody(object.body)
        scene.remove(object.mesh)
    }
    objectsToUpdate.splice(0, objectsToUpdate.length)
}

debugObject.createMacWall = () => {
    reset()
    createMacWall()
}
gui.add(debugObject, 'createMacWall').name("Mac Wall")

debugObject.createEvanWall = () => {
    reset()
    createEvanWall()
}
gui.add(debugObject, 'createEvanWall').name("Evan Wall")

debugObject.createTonyWall = () => {
    reset()
    createTonyWall()
}
gui.add(debugObject, 'createTonyWall').name("Tony Wall")

debugObject.createChiliWall = () => {
    reset()
    createChiliWall()
}
gui.add(debugObject, 'createChiliWall').name("Chili Wall")

debugObject.createJoshWall = () => {
    reset()
    createJoshWall()
}
gui.add(debugObject, 'createJoshWall').name("Josh Wall")

debugObject.createWillWall = () => {
    reset()
    createWillWall()
}
gui.add(debugObject, 'createWillWall').name("Will Wall")


//Canvas
const canvas = document.querySelector('canvas.webgl')

//Scene
const scene = new THREE.Scene()

const hitSound = new Audio('/sounds/hit.mp3')

const playHitSounds = (collision) =>
{   
    const contactStrength = collision.contact.getImpactVelocityAlongNormal()
    if (contactStrength > 1.5) {
        if (contactStrength > 30) {
            hitSound.volume = 1
        } else {
            hitSound.volume = collision.contact.getImpactVelocityAlongNormal() / 30
        }
        hitSound.currentTime = 0
        hitSound.play()
    }  
}


const axesHelper = new THREE.AxesHelper(1)
scene.add(axesHelper)

//Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({
        color: "#A7E8BD",
        metalness: 0,
        roughness: 0.5
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
directionalLight.position.set(-10, 3, 5)
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
    canvas: canvas,
    alpha: true
})

renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor("#A6DDD4", 1)

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
    metalness: 0.8,
    roughness: 0.7
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
    body.addEventListener('collide', playHitSounds)
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
        playHitSounds
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

const evanColors = [["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
["#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00"],
["#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#000000", "#000000", "#000000", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00"],
["#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00"],
["#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00"],
["#ffffff", "#000000", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00"],
["#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#000000"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#ff5e00", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#ff5e00", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#fcceb0", "#000000", "#000000", "#fcceb0", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#457067", "#457067", "#fcceb0", "#fcceb0", "#fcceb0", "#cfcfcf", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#457067", "#457067", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#457067", "#457067", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fcceb0", "#000000", "#fcceb0", "#457067", "#457067", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#457067", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fcceb0", "#000000", "#fcceb0", "#457067", "#457067", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#593425", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#fcceb0", "#fcceb0", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#593425", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#593425", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#593425", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#593425", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#593425", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#593425", "#593425", "#fcceb0", "#fcceb0", "#fcceb0", "#fcceb0", "#593425", "#593425", "#593425", "#593425", "#593425", "#fcceb0", "#fcceb0", "#fcceb0", "#593425", "#593425", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#593425", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]]

const joshColors = [["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
["#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34"],
["#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34"],
["#000000", "#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34"],
["#ffffff", "#000000", "#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34"],
["#ffffff", "#ffffff", "#000000", "#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#000000", "#000000"],
["#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#314d34", "#314d34", "#314d34", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#314d34", "#314d34", "#314d34", "#314d34", "#314d34", "#000000", "#000000", "#000000", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#fac4af", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fac4af", "#fac4af", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#fac4af", "#fac4af", "#000000", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#fac4af", "#fac4af", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#fac4af", "#38190c", "#38190c", "#38190c", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#fac4af", "#38190c", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#fac4af", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#38190c", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#fac4af", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#fac4af", "#000000", "#000000", "#38190c", "#38190c", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#000000", "#fac4af", "#fac4af", "#fac4af", "#000000", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#000000", "#000000", "#000000", "#38190c", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]]

const chiliColors = [["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
["#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000"],
["#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000"],
["#000000", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#ebc29b", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#000000"],
["#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#ebc29b", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#000000", "#000000", "#000000", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#000000", "#000000", "#ebc29b", "#000000", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#546d8e", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#546d8e", "#546d8e", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#000000", "#546d8e", "#546d8e", "#546d8e", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#546d8e", "#546d8e", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#546d8e", "#546d8e", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#ebc29b", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ebc29b", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#000000", "#ebc29b", "#ebc29b", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#ebc29b", "#38190c", "#38190c", "#ebc29b", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#000000", "#ebc29b", "#ebc29b", "#38190c", "#38190c", "#ebc29b", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#ebc29b", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#ebc29b", "#000000", "#ebc29b", "#ebc29b", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#ebc29b", "#ebc29b", "#38190c", "#38190c", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#ebc29b", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ebc29b", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#38190c", "#38190c", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#000000", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#ebc29b", "#000000", "#38190c", "#38190c", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ebc29b", "#ebc29b", "#ebc29b", "#ebc29b", "#000000", "#000000", "#000000", "#000000", "#38190c", "#38190c", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#38190c", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]]

const willColors = [["#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
["#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#000000"],
["#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59"],
["#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#000000"],
["#000000", "#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#000000"],
["#ffffff", "#000000", "#000000", "#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#243b59", "#000000", "#000000", "#000000"],
["#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#243b59", "#243b59", "#243b59", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#243b59", "#243b59", "#243b59", "#243b59", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#f0c078", "#f0c078", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#f0c078", "#f0c078", "#000000", "#f0c078", "#f0c078", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#f0c078", "#000000", "#f0c078", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#f0c078", "#000000", "#f0c078", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#f0c078", "#f0c078", "#f0c078", "#f0c078", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"],
["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]]

const createWillWall = () => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            createBox(0.5, 0.5, 0.5, {x: 0, y: y / 2, z: (x / 2) - 8}, willColors[y][x])
        }
    }
}

const createChiliWall = () => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            createBox(0.5, 0.5, 0.5, {x: 0, y: y / 2, z: (x / 2) - 8}, chiliColors[y][x])
        }
    }
}

const createJoshWall = () => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            createBox(0.5, 0.5, 0.5, {x: 0, y: y / 2, z: (x / 2) - 8}, joshColors[y][x])
        }
    }
}

const createEvanWall = () => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            createBox(0.5, 0.5, 0.5, {x: 0, y: y / 2, z: (x / 2) - 8}, evanColors[y][x])
        }
    }
}


const createTonyWall = () => {
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
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

createMacWall()

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

