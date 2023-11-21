import type { ARScene } from "./scene";
import useLogger from './logger';
import * as THREE from "three";
import { THREEx, ARjs } from "@ar-js-org/ar.js-threejs"
import type { ArMarkerControls } from "@ar-js-org/ar.js-threejs/types/ArMarkerControls";

THREEx.ArToolkitContext.baseURL = "./";

const log = useLogger();

export interface AREngineDelegate {
    onRender?(renderer: THREE.Renderer): void;
    onMarkerFound?(marker: ArMarkerControls): void;
}

// log.info("webar.ts")

export const useAREngine = (): AREngine => {
    return AREngine.getSingleton();
}

export class AREngine {
    scene = new THREE.Scene();
    // // renderer?: THREE.WebGLRenderer;
    baseNode?: THREE.Object3D;
    delegate?: AREngineDelegate;

    arScene?: ARScene;

    //シングルトンを作る（インスタンスがアプリケーション内で唯一であることを保証する）
    private static instance: AREngine | null = null;
    public static getSingleton(): AREngine {
        if (!AREngine.instance) {
            AREngine.instance = new AREngine();
        }
        return AREngine.instance;
    }

    private constructor() { }

    replaceScene(ar_scene: ARScene) {
        const nodes = ar_scene.makeObjectTree();

        if (this.baseNode) {
            this.scene.remove(this.baseNode);
        }
        this.baseNode = new THREE.Object3D();
        this.baseNode.add(nodes);
        this.scene.add(this.baseNode!);

        this.arScene = ar_scene;
    }


    start(video_canvas: string) {

        const ar_base_element = document.getElementById(video_canvas)

        if (!ar_base_element) {
            console.log(`${video_canvas} is not found`);
            return;
        }

        /* RENDERER */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        // renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        // renderer.xr.enabled = true;
        ar_base_element.appendChild(renderer.domElement);

        /* Scene */
        const scene = this.scene; //new THREE.Scene();
        // scene.background = new THREE.Color(0x000000);

        /* Camera */
        const camera = new THREE.Camera();
        scene.add(camera);

        /* Light */
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        light.position.set(0.5, 1, 0.25);
        scene.add(light);


        //////////////////////////////////////////////////////////////////////////////////
        //		add an object in the scene
        //////////////////////////////////////////////////////////////////////////////////

        // // add a torus knot
        // var geometry = new THREE.BoxGeometry(1, 1, 1);
        // var material = new THREE.MeshNormalMaterial({
        //     transparent: true,
        //     opacity: 0.5,
        //     side: THREE.DoubleSide
        // });
        // var mesh = new THREE.Mesh(geometry, material);
        // mesh.position.y = geometry.parameters.height / 2
        // scene.add(mesh);

        // var torusKnotGeometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
        // var material = new THREE.MeshNormalMaterial();
        // var torusMesh = new THREE.Mesh(torusKnotGeometry, material);
        // torusMesh.position.y = 0.5
        // scene.add(torusMesh);
        make_coordinate_arrows(scene, 1);


        ////
        // set up ARToolKit
        ///

        const arToolkitSource = new THREEx.ArToolkitSource({
            // to read from the webcam
            sourceType: 'webcam',

            sourceWidth: window.innerWidth > window.innerHeight ? 640 * 2 : 480 * 2,
            sourceHeight: window.innerWidth > window.innerHeight ? 480 * 2 : 640 * 2,
        })

        const arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: THREEx.ArToolkitContext.baseURL + './data/camera_para.dat',
            detectionMode: 'mono',
        })

        const initARContext = () => { // create atToolkitContext

            // initialize it
            arToolkitContext.init(() => { // copy projection matrix to camera
                camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

                arToolkitContext.arController.orientatio = getSourceOrientation();
                // arToolkitContext.arController.options.orientation = getSourceOrientation();
                console.log('arToolkitContext', arToolkitContext);
                window.arToolkitContext = arToolkitContext;
            })

            // MARKER
            var arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
                type: 'pattern',
                patternUrl: THREEx.ArToolkitContext.baseURL + './data/hiro.armarker',
                // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
                // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
                changeMatrixMode: 'cameraTransformMatrix',
                minConfidence: 0.001,
                // size: 1
            })

            arMarkerControls.addEventListener("markerFound", () => {
                console.log("marker found!");

                this.delegate?.onMarkerFound?.(arMarkerControls);
            })


            scene.visible = false

            console.log('ArMarkerControls', arMarkerControls);
            window.arMarkerControls = arMarkerControls;
        }

        arToolkitSource.init(function onReady() {

            arToolkitSource.domElement.addEventListener('canplay', () => {
                console.log(
                    'canplay',
                    'actual source dimensions',
                    arToolkitSource.domElement.videoWidth,
                    arToolkitSource.domElement.videoHeight,
                );
                initARContext();
            }) as unknown as HTMLVideoElement;
            window.arToolkitSource = arToolkitSource;
            setTimeout(() => {
                onResize()
            }, 2000);
        }, function onError() { })


        // handle resize
        window.addEventListener('resize', function () {
            onResize()
        })

        function onResize() {
            arToolkitSource.onResizeElement()
            arToolkitSource.copyElementSizeTo(renderer.domElement)
            if (window.arToolkitContext.arController !== null) {
                arToolkitSource.copyElementSizeTo(window.arToolkitContext.arController.canvas)
            }
        }


        function getSourceOrientation(): string {
            if (!arToolkitSource) {
                return '';
            }

            console.log(
                'actual source dimensions',
                arToolkitSource.domElement.videoWidth,
                arToolkitSource.domElement.videoHeight
            );

            if (arToolkitSource.domElement.videoWidth > arToolkitSource.domElement.videoHeight) {
                console.log('source orientation', 'landscape');
                return 'landscape';
            } else {
                console.log('source orientation', 'portrait');
                return 'portrait';
            }
        }



        const render = (delta_sec: number) => {
            this.arScene?.animate(delta_sec);
            this.delegate?.onRender?.(renderer);
            renderer.render(scene, camera);
        }

        const update_ar = () => {
            if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
                return;
            }

            arToolkitContext.update(arToolkitSource.domElement)

            // update scene.visible if the marker is seen
            scene.visible = camera.visible
        }

        // フレームごとに関数を呼び出すように設定する（アニメーションのため）
        var lastTimeMsec: number;
        const animate = (nowMsec: number) => {
            // keep looping
            requestAnimationFrame(animate);
            // measure time
            lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
            var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
            lastTimeMsec = nowMsec;

            // call each update function
            update_ar();
            render(deltaMsec / 1000);

            // console.log("render")
        }
        requestAnimationFrame(animate);
    }
};

function make_coordinate_arrows(node: THREE.Object3D, len: number) {
    // X軸の矢印（赤色）
    const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), len, 0xff0000);
    node.add(arrowX);

    // Y軸の矢印（緑色）
    const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), len, 0x00ff00);
    node.add(arrowY);

    // Z軸の矢印（青色）
    const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), len, 0x0000ff);
    node.add(arrowZ);
}