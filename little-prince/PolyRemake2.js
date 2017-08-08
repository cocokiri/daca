'use strict'
//COLORS
let Colors = {
    red: 0xf25346,
    beige: 0xd8d0d1,
    brown: 0x59332e,
    brownDark: 0x23190f,
    orange: 0xF5986E,
    yellow: 0xf4ce93,
    //blue: 0x68c3c0,
    black: "#080202",
    blue: "#3560e0",
    white: "#ffffff",
    purple: "#441dc6"
};

window.addEventListener("load", init);

//------DECLARATIONS -------
let scene,
    camera,
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane,
    HEIGHT,
    WIDTH,
    renderer,
    container;

let ambientLight,
    hemisphereLight,
    shadowLight;

let midi;
let gameScore = 0;
let counter = 0;
let gameSpeed = 1 + gameScore / 300 + 100;
let startPos,
    nextPos;

let currentNoteSet = [48, 50, 52, 53]; // CDEF
let noteRange = currentNoteSet[currentNoteSet.length - 1] - currentNoteSet[0]; //first and last note --> total distance

//will get multiplied with steps (currentHeight +- new played Note)

let enemies = [];
let rings = [];

let maxEnemies = 6;
let spaceBetweenEnemies = 10;
const CENTERRADIUS = 200;
const RINGDISTANCE = 20;
const RINGWIDTH = 10;

let player,
    sea,
    sphere,
    billboard;

let position;
let seaStartPoint;

let deltaTime = 0;
let FPS = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();

//----------  EXECUTION -----------

// window.addEventListener("mousedown", function() {
//     let i = Math.round(Math.random() * 3);
//     let values = [-2, -1, 1, 2];
//     nextPos.y += values[i] * 10;
// });

let canv,
    ctx;
let totalSpawns = 0;
let record;
let previousMidi = currentNoteSet[2];

function init() {
    canv = document.getElementById("UI");
    canv.width = window.innerWidth;
    canv.height = window.innerHeight;
    ctx = canv.getContext("2d");

    //SETUP AUDIO and record function
    navigator.getUserMedia({
        audio: true
    }, function(stream) {
        record = SetupAuxNodes(stream);
    }, console.log);
    //record is undefined if user doesn't click 'ALLOW'

    new Scene({x: 0, y: 250, z: 100});
    new Lights();

    player = new Player();
    player.mesh.scale.set(1 / 8, 1 / 8, 1 / 8);
    const PLAYER_XPOS = 0 - window.innerWidth / 20;
    player.mesh.position.set(PLAYER_XPOS, CENTERRADIUS + 50, 0);
    scene.add(player.mesh);

    startPos = player.mesh.position.clone();
    nextPos = startPos; //let's start the ride without up and downs

    window.rings = rings;

    for (let i = 0; i < 10; i++) {
        let ringRadius = CENTERRADIUS + RINGDISTANCE * i; //will become previous outer
        rings[i] = new Ring(ringRadius, ringRadius + RINGWIDTH, NumberToHSL(i));
        rings[i].radius = ringRadius;

        scene.add(rings[i].mesh);
    };

    for (let i = enemies.length; i < maxEnemies; i++) {
        spawnObjOnRing(rings[i]);
    }

    renderer.render(scene, camera);

    loop();
}

const spawnObjOnRing = function(ring) {
    let temp = new Cube(2, "white");
    temp.distanceFromCenter = ring.radius + RINGWIDTH / 2;
    temp.setPos(30);
    temp.mesh.material.color.set("red");
    //temp.mesh.position.x += totalSpawns * spaceBetweenEnemies; //this should get bigger with time...another 3 hours of my life...
    totalSpawns++; //active and dead enemies
    enemies.push(temp);
    scene.add(temp.mesh);
    return temp;
}

//if input has changed & input is part of possible midis in this game ... loop over inputevents
function loop() {
    //enemies = []; //reset enemies array;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = "white";
    ctx.fillText(gameScore.toString(), window.innerWidth / 2, 100);
    //PUT INPUT RELATED STUFF IN HERE!! otherwise NaN bugs inc.!
    if (record) { //wait for user auth. Record gets assigned in the SetupAudio Callback
        midi = record(); //get current Pitch in MIDI note
        inputToPlayerMove(midi, previousMidi);
        //delete current but keep the stuff on the bottom of screen

        //Display Pitch on Screen
        if (midi > 0) { //if legit note

            drawTextwBackground(ctx, chromaticC[Math.round(midi) % 12], window.innerWidth / 2, 40, midi % 12, 70, 30);
        }
        //setTimeOut(console.log(midi), 3000);

        //bad noodle code for changing cabin and propeller color with pitch
        for (let ring of rings) {
            ring.mesh.rotation.z += 0.00002 * gameSpeed;
        }

        //Dynamically COLOR the plane
        for (let child of player.mesh.children) {
            if (child.name == "cabin" && midi > 0) {
                child.material.color.set(NumberToHSL(midi % 12, "70%", "80%"));
                player.propeller.material.color.set(NumberToHSL(midi % 12));
                player.propeller.children[0].material.color.set(NumberToHSL(midi % 12));
            }
        }

        // let background = document.getElementById("#world").background;
        // background.setStyle = linear-gradient(#05093e, #c15e5e);

        //arrows
        //if note too high arrow rotated 180 otherwise upright if too low
        //new path - triangle
        //on top of rectangle (rectX - rectsize/2)
        //let triangle = new Path("M " + window.innerWidth/2 + " " + 50 + " L 300 500 L 50 400");

    }

    player.propeller.rotation.x += gameSpeed * deltaTime * .005;
    // player.pilot.updateHairs();

    newTime = new Date().getTime();
    deltaTime = newTime - oldTime;
    oldTime = newTime;
    FPS = 1000 / deltaTime;

    if (enemies.length < maxEnemies) {
        let randomNote = Math.round(Math.random() * 6);
        spawnObjOnRing(rings[randomNote]);
    }

    //DEATHRULES & COLLISIONS
    counter++;
    if (counter % 10 == 0) {
        for (let i = 0; i < enemies.length; i++) {
            //let worldPos = GlobalPos(enemy.mesh);
            const enemy = enemies[i];
            if (isColliding(player.mesh, enemy.mesh)) {
                scene.remove(enemy.mesh);
                gameScore += 10;
                enemies.splice(i, 1);
                //i--;

            }

            if (enemy.mesh.position.x <= player.mesh.position.x - 30) {
                //if collision or already off screen --> Destroy
                scene.remove(enemy.mesh);
                enemies.splice(i, 1);

                //i--;
                console.log(`Destroyed ${enemy}`);
            }
        }
    }

    //ROTATE objs
    for (let enemy of enemies) {
        enemy.currentAngle -= 0.1;
        enemy.setPos(enemy.currentAngle);
    }

    //MOVE PLAYER
    let posNow = player.mesh.position.clone(); //clone makes both == instead of === ...3 hours of my life for that BS
    let deltaVec = moveToPos(posNow, nextPos); //moveToPos returns an incremental Vector
    player.mesh.position.add(deltaVec.multiplyScalar(3)); //try formulas for easing here

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

//-------- CONSTRUCTORS
class Ring {
    constructor(innerRadius, outerRadius, color) {
        let ringgeom = new THREE.RingGeometry(innerRadius, outerRadius, 100);
        //ringgeom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

        let ringmat = new THREE.MeshBasicMaterial({color: color, opacity: 0.5, side: THREE.DoubleSide});
        this.mesh = new THREE.Mesh(ringgeom, ringmat);
        this.mesh.position.z = -10; //not cross player wing
    }
    removeChild(child) {
        this.mesh.remove(child);
    }
}

var Pilot = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";
    this.angleHairs = 0;

    var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    var bodyMat = new THREE.MeshPhongMaterial({color: Colors.red, shading: THREE.FlatShading});
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);

    this.mesh.add(body);

    var faceGeom = new THREE.BoxGeometry(10, 10, 10);
    var faceMat = new THREE.MeshLambertMaterial({color: Colors.white});
    var face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    var hairGeom = new THREE.BoxGeometry(4, 4, 4);
    var hairMat = new THREE.MeshLambertMaterial({color: Colors.red});
    var hair = new THREE.Mesh(hairGeom, hairMat);
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));
    var hairs = new THREE.Object3D();

    this.hairsTop = new THREE.Object3D();

    for (var i = 0; i < 12; i++) {
        var h = hair.clone();
        var col = i % 3;
        var row = Math.floor(i / 3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
        h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 1, 1));
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0)
    hairs.add(hairBack);
    hairs.position.set(-5, 5, 0);

    this.mesh.add(hairs);

    var glassGeom = new THREE.BoxGeometry(5, 5, 5);
    var glassMat = new THREE.MeshLambertMaterial({color: Colors.black});
    var glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    var glassL = glassR.clone();
    glassL.position.z = -glassR.position.z

    var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    var glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    var earGeom = new THREE.BoxGeometry(2, 3, 2);
    var earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    var earR = earL.clone();
    earR.position.set(0, 0, 6);
    this.mesh.add(earL);
    this.mesh.add(earR);
}

Pilot.prototype.updateHairs = function() {
    //*
    var hairs = this.hairsTop.children;

    var l = hairs.length;
    for (var i = 0; i < l; i++) {
        var h = hairs[i];
        h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
    }
    this.angleHairs += gameSpeed / 20 * deltaTime * 40;
    //*/
}

class Player {
    constructor() {
        // Cabin

        var matCabin = new THREE.MeshPhongMaterial({color: Colors.blue, shading: THREE.FlatShading});
        var geomParent = new THREE.BoxGeometry(0, 0, 0);

        this.mesh = new THREE.Mesh(geomParent, matCabin);
        var geomCabin = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);

        this.mesh.name = "airPlane";
        geomCabin.vertices[4].y -= 10;
        geomCabin.vertices[4].z += 20;
        geomCabin.vertices[5].y -= 10;
        geomCabin.vertices[5].z -= 20;
        geomCabin.vertices[6].y += 30;
        geomCabin.vertices[6].z += 20;
        geomCabin.vertices[7].y += 30;
        geomCabin.vertices[7].z -= 20;

        var cabin = new THREE.Mesh(geomCabin, matCabin);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        cabin.name = "cabin";
        this.mesh.add(cabin);

        // Engine

        var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
        var matEngine = new THREE.MeshPhongMaterial({color: Colors.yellow, shading: THREE.FlatShading});
        var engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.x = 50;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);

        // Tail Plane

        var geomTailPlane = new THREE.BoxGeometry(15, 25, 5, 1, 1, 1);
        var matTailPlane = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(-40, 20, 0);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);

        // Wings

        var geomSideWing = new THREE.BoxGeometry(30, 5, 120, 1, 1, 1);
        var matSideWing = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        sideWing.position.set(0, 15, 0);
        sideWing.castShadow = true;
        sideWing.receiveShadow = true;
        this.mesh.add(sideWing);

        var geomWindshield = new THREE.BoxGeometry(3, 15, 20, 1, 1, 1);
        var matWindshield = new THREE.MeshPhongMaterial({color: Colors.white, transparent: true, opacity: .3, shading: THREE.FlatShading});;
        var windshield = new THREE.Mesh(geomWindshield, matWindshield);
        windshield.position.set(5, 27, 0);

        windshield.castShadow = true;
        windshield.receiveShadow = true;

        this.mesh.add(windshield);

        var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
        geomPropeller.vertices[4].y -= 5;
        geomPropeller.vertices[4].z += 5;
        geomPropeller.vertices[5].y -= 5;
        geomPropeller.vertices[5].z -= 5;
        geomPropeller.vertices[6].y += 5;
        geomPropeller.vertices[6].z += 5;
        geomPropeller.vertices[7].y += 5;
        geomPropeller.vertices[7].z -= 5;
        var matPropeller = new THREE.MeshPhongMaterial({color: Colors.brown, shading: THREE.FlatShading});
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;

        var geomBlade = new THREE.BoxGeometry(1, 80, 10, 1, 1, 1);
        var matBlade = new THREE.MeshPhongMaterial({color: Colors.brownDark, shading: THREE.FlatShading});
        var blade1 = new THREE.Mesh(geomBlade, matBlade);
        blade1.position.set(8, 0, 0);

        blade1.castShadow = true;
        blade1.receiveShadow = true;

        var blade2 = blade1.clone();
        blade2.rotation.x = Math.PI / 2;

        blade2.castShadow = true;
        blade2.receiveShadow = true;

        this.propeller.add(blade1);
        this.propeller.add(blade2);
        this.propeller.position.set(60, 0, 0);
        this.propeller.children[0].name = "propeller";
        this.propeller.children[1].name = "propeller";

        this.mesh.add(this.propeller);

        var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
        var wheelProtecMat = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
        wheelProtecR.position.set(25, -20, 25);
        this.mesh.add(wheelProtecR);

        var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
        var wheelTireMat = new THREE.MeshPhongMaterial({color: Colors.black, shading: THREE.FlatShading});
        var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
        wheelTireR.position.set(25, -28, 25);

        var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
        var wheelAxisMat = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading});
        var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
        wheelTireR.add(wheelAxis);

        this.mesh.add(wheelTireR);

        var wheelProtecL = wheelProtecR.clone();
        wheelProtecL.position.z = -wheelProtecR.position.z;
        this.mesh.add(wheelProtecL);

        var wheelTireL = wheelTireR.clone();
        wheelTireL.position.z = -wheelTireR.position.z;
        this.mesh.add(wheelTireL);

        var wheelTireB = wheelTireR.clone();
        wheelTireB.scale.set(.5, .5, .5);
        wheelTireB.position.set(-35, -5, 0);
        this.mesh.add(wheelTireB);

        var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
        suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0))
        var suspensionMat = new THREE.MeshPhongMaterial({color: Colors.yellow, shading: THREE.FlatShading});
        var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
        suspension.position.set(-35, -5, 0);
        suspension.rotation.z = -.3;
        this.mesh.add(suspension);

        this.pilot = new Pilot();
        this.pilot.mesh.position.set(-10, 27, 0);
        this.mesh.add(this.pilot.mesh);

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.mesh.rotateY(Math.PI * 0.15);
        this.mesh.rotateX(Math.PI * 0.1);

        this.mesh.collisionRadius = 3;
    }
}

class Cube { //it's better to make an Object instead of mesh...more control later
    constructor(scale, color = "white") {
        let geom = new THREE.BoxGeometry(scale, scale, scale);
        let mat = new THREE.MeshPhongMaterial({color: color});
        //geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        //console.log(geom.vertices.length + "length");
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.rotationSpeed = 0.005; //in radians
        this.mesh.collisionRadius = 3;
        this.mesh.name = "cuby";
        this.mesh.Fakeangle = 0;
        this.distanceFromCenter = 0.5;
        this.startAtAngle = 20;
        this.currentAngle = this.startAtAngle;
    }
    explode(counter = 10) {
        this.mesh.parent.mesh.remove(this.mesh);
        for (let i = 0; i < 6; i++) {
            let particle = new Cube(1, "white");
            particle.mesh.scale.set(1 / 3, 1 / 3, 1 / 3);
            particle.mesh.position.y = this.mesh.position.y + 10;
        }
    }

    setPos(angle = 20) { //this.note; this.angle;
        let vec = angleToVector(angle); //einheitsVector
        //this.mesh.material.color.set(NumberToHSL(note));
        this.mesh.position.x = vec.x * this.distanceFromCenter;
        //calculates the X change of a point at height ~3200 and gives it as slack for next spawn
        this.mesh.position.y = -vec.y * this.distanceFromCenter;
        //this.mesh.position.z = Math.random() * 5;
    }

    rotateMe(speed = 1) {
        this.distanceFromCenter = calcDistance(0, 0, this.mesh.position.x, this.mesh.position.z);
        this.mesh.angle += speed * 0.01;
    }
}

class Sea {
    constructor(radius = 100) {
        this.radius = radius;
        let geom = new THREE.SphereGeometry(radius, 32, 32);
        this.waves = [];
        var numVertices = geom.vertices.length;
        for (let i = 0; i < numVertices; i++) {
            var v = geom.vertices[i];
            //v.y = Math.random()*30;
            this.waves.push({
                y: v.y,
                x: v.x,
                z: v.z,
                ang: Math.random() * (Math.PI * 2),
                amp: 5 + Math.random() * 15,
                speed: Math.random() * (0.006)
            });
        };
        let mat = new THREE.MeshPhongMaterial({color: Colors.red, transparent: true, opacity: .85, shading: THREE.FlatShading});

        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.rotationSpeed = 0.0001; //in radians
        this.mesh.name = "waves";
        this.mesh.receiveShadow = true;
    }
    removeChild(child) {
        this.mesh.remove(child);
    }
}

class Lights {
    constructor() {
        hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

        ambientLight = new THREE.AmbientLight(0xdc8874, .6);

        shadowLight = new THREE.DirectionalLight(0xffffff, .4);
        shadowLight.position.set(0, 100, 200);
        shadowLight.castShadow = true;
        shadowLight.shadow.camera.left = -400;
        shadowLight.shadow.camera.right = 400;
        shadowLight.shadow.camera.top = 400;
        shadowLight.shadow.camera.bottom = -400;
        shadowLight.shadow.camera.near = 1;
        shadowLight.shadow.camera.far = 1000;
        shadowLight.shadow.mapSize.width = 4096;
        shadowLight.shadow.mapSize.height = 4096;

        scene.add(hemisphereLight);
        scene.add(shadowLight);
        scene.add(ambientLight);
    }
}

class Scene {
    constructor(settings = {
        x: 0,
        y: 250,
        z: 100,
        fieldOfView: 80,
        orthographic: false
    }) {
        let HEIGHT = window.innerHeight;
        let WIDTH = window.innerWidth;
        scene = new THREE.Scene(); // Create the scene

        // Create the camera
        let aspectRatio = WIDTH / HEIGHT;
        let fieldOfView = settings.fieldOfView;
        let nearPlane = 1;
        let farPlane = 500;

        camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

        if (settings.orthographic) {
            camera = new THREE.OrthographicCamera(WIDTH / - 2, WIDTH / 2, HEIGHT / 2, HEIGHT / - 2, nearPlane, farPlane);
        }

        camera.position.set(settings.x, settings.y, settings.z); // Set the position of the camera. 2 hours of my life bc didn't catch it

        renderer = new THREE.WebGLRenderer({alpha: true, antialias: true}); // Allow transparency to show the gradient background we defined in the CSS//less performant, but, as our project is low-poly based, it should be fine :)
        renderer.setSize(WIDTH, HEIGHT);
        renderer.shadowMap.enabled = true; //Shadows On

        container = document.getElementById("world");
        container.appendChild(renderer.domElement);
        window.addEventListener('resize', handleWindowResize, false);
    }
}

//--------FUNCTIONS----------

function GlobalPos(obj) {
    let temp = new THREE.Vector3();
    let realPos = temp.setFromMatrixPosition(obj.matrixWorld);
    return realPos;
}

function moveToPos(pos1, pos2, seconds = 1) {
    let p1 = pos1.clone(); //new THREE.Vector3(pos1.x, pos1.y, pos1.z); //you have to otherwise the Vector gets changed GLOBALLY!!!!
    let p2 = pos2.clone(); //new THREE.Vector3(pos2.x, pos2.y, pos2.z);
    let differenceVec = p2.sub(p1);
    let deltaVec = differenceVec.multiplyScalar(1 / 100);
    //  console.log(deltaVec);
    return deltaVec;
} //THREE should have that innately

function distanceBetweenObjects3D(obj1, obj2) {
    if (obj1.type != "Mesh") {
        obj1 = obj1.mesh;
    }
    if (obj2.type != "Mesh") {
        obj2 = obj2.mesh;
    }
    let pos1 = GlobalPos(obj1);
    let pos2 = GlobalPos(obj2);

    let distance = calcDistance3D(pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z);
    return distance;
} //THREE has inherent functions for that maybe

function isColliding(obj1, obj2) {
    if ((obj1.collisionRadius + obj2.collisionRadius) > distanceBetweenObjects3D(obj1, obj2)) {
        return true;
    } else {
        return false;
    };
} //just take arbitrary distanceTreshold instead of 2 radi

function inputToPlayerMove(midiInput, prevMidi) {
    if (midiInput < currentNoteSet[0] - 1 || midiInput > currentNoteSet[currentNoteSet.length - 1] + 1) {
        return; //if input is out of Range
    } else {
        let noteDelta = midiInput - prevMidi; //+2 is major Second = 2 steps up
        let yChange = noteDelta * 10;
        nextPos.y += yChange;
        previousMidi = midiInput;
    }
}

function handleWindowResize() {
    //update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}
