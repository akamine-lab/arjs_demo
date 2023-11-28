import type { ARScene } from "./Scene3D";
import useLogger from './logger';
import * as THREE from "three";
import { THREEx, ARjs } from "@ar-js-org/ar.js-threejs"
import type { ArMarkerControls } from "@ar-js-org/ar.js-threejs/types/ArMarkerControls";

THREEx.ArToolkitContext.baseURL = "./";

const log = useLogger();

export interface AREngineDelegate {
    onRender?(renderer: THREE.Renderer, duration_sec: number): void;
    onMarkerFound?(marker: ArMarkerControls): void;
    onFrameCaptured?(video_element: HTMLVideoElement): void;
}

// log.info("webar.ts")

export const useAREngine = (): AREngine => {
    return AREngine.getSingleton();
}

export class AREngine {
    scene = new THREE.Scene();
    renderer?: THREE.Renderer;
    // // renderer?: THREE.WebGLRenderer;
    baseNode?: THREE.Object3D;
    camera?: THREE.Camera;
    // videoElement?: HTMLVideoElement;

    delegate?: AREngineDelegate;
    arScene?: ARScene;
    useAR: boolean = true;

    renderingLoopHooks: Array<(n: number) => void> = [];

    //シングルトンを作る（インスタンスがアプリケーション内で唯一であることを保証する）
    private static instance: AREngine | null = null;
    public static getSingleton(): AREngine {
        if (!AREngine.instance) {
            AREngine.instance = new AREngine();
        }
        return AREngine.instance;
    }

    private constructor() {
    }

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

    setupRenderer(video_canvas: string) {
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
        this.renderer = renderer;

        /* Scene */
        const scene = this.scene; //new THREE.Scene();
        // scene.background = new THREE.Color(0x000000);

        /* Camera */
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        camera.position.y = 5;
        camera.lookAt(0, 0, 0);
        // scene.add(camera);
        this.camera = camera;

        /* Light */
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        light.position.set(0.5, 1, 0.25);
        scene.add(light);

        make_coordinate_arrows(scene, 1);


        // レンダリングループ。Three.jsのシーンが更新される度に実行
        const render = (delta_sec: number) => {
            if (this.camera) {
                this.arScene?.animate(delta_sec); // 設定したシーンのアニメーションの実行
                this.delegate?.onRender?.(renderer, delta_sec); //カスタムルーチンを実行
                renderer.render(this.scene!, this.camera); //Three.jsのシーンを描画    
            }
        }
        this.renderingLoopHooks.push(render);

        // フレームごとに関数を呼び出すように設定する（アニメーションのため）
        var lastTimeMsec: number;
        const animate = (nowMsec: number) => {
            // measure time
            lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
            var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
            lastTimeMsec = nowMsec;

            // call each update function
            for (const func of this.renderingLoopHooks) {
                func(deltaMsec / 1000);
            }

            // keep looping
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        //ブラウザをリサイズした時の処理
        // handle resize
        window.onresize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    startAR() {
        this.camera = new THREE.Camera();
        this.scene.add(this.camera);
        ////
        // set up ARToolKit
        ///

        //AR.jsのマーカー検出エンジンの初期化
        const arToolkitSource = new THREEx.ArToolkitSource({
            // to read from the webcam
            sourceType: 'webcam',

            sourceWidth: window.innerWidth > window.innerHeight ? 640 * 2 : 480 * 2,
            sourceHeight: window.innerWidth > window.innerHeight ? 480 * 2 : 640 * 2,
        })
        // console.log(arToolkitSource)

        //ARtoolkitのカメラ(webcamera)パラメータの読み込み
        const arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: THREEx.ArToolkitContext.baseURL + './data/camera_para.dat',
            detectionMode: 'mono',
        })

        // ARToolkitの初期化が終了してから呼び出される
        const initARContext = () => { // create atToolkitContext

            //ここは変更の必要なし
            // initialize it
            arToolkitContext.init(() => { // copy projection matrix to camera
                this.camera!.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

                arToolkitContext.arController.orientatio = getSourceOrientation();
                // arToolkitContext.arController.options.orientation = getSourceOrientation();
                console.log('arToolkitContext', arToolkitContext);
                window.arToolkitContext = arToolkitContext;
            })

            // MARKER
            var arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, this.camera!, {
                type: 'pattern',
                // マーカーの内側のマークに対応するパターンファイル
                patternUrl: THREEx.ArToolkitContext.baseURL + './data/hiro.armarker',
                // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
                // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
                // カメラを制御する設定。マーカーの中心が、ワールドの原点になる。
                changeMatrixMode: 'cameraTransformMatrix',
                // マーカー識別の閾値。
                minConfidence: 0.001,
                // size: 1
            })

            //マーカーが見つかった時に実行されるコールバック
            arMarkerControls.addEventListener("markerFound", () => {
                console.log("marker found!");

                this.delegate?.onMarkerFound?.(arMarkerControls);
            })


            // this.scene.visible = false

            console.log('ArMarkerControls', arMarkerControls);

            //マーカー検出オブジェクトをグローバルに保存
            window.arMarkerControls = arMarkerControls;
        }

        const onResize = () => {
            if (!this.renderer) { return }
            arToolkitSource.onResizeElement()
            arToolkitSource.copyElementSizeTo(this.renderer.domElement)
            if (window.arToolkitContext.arController !== null) {
                arToolkitSource.copyElementSizeTo(window.arToolkitContext.arController.canvas)
            }
        }

        var video_element: HTMLVideoElement;
        // ARtoolkitの初期化
        arToolkitSource.init(() => {
            arToolkitSource.domElement.addEventListener('canplay', () => {
                console.log(
                    'canplay',
                    'actual source dimensions',
                    arToolkitSource.domElement.videoWidth,
                    arToolkitSource.domElement.videoHeight,
                );
                initARContext();
            });
            video_element = arToolkitSource.domElement as HTMLVideoElement;

            window.arToolkitSource = arToolkitSource;
            setTimeout(() => {
                onResize()
            }, 2000);
        }, function onError() {
            console.log(arToolkitSource);

        })


        //ブラウザをリサイズした時の処理
        // handle resize
        window.onresize = onResize

        // スマホの向きを検出している？
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
        // artoolkitの処理（フレームごとの処理）
        const update_ar = (delta: number) => {
            if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
                return;
            }

            //ここで、マーカーの検出が行われる（多分）
            arToolkitContext.update(arToolkitSource.domElement)

            if (video_element) {
                this.delegate?.onFrameCaptured?.(video_element);
            }

            // update scene.visible if the marker is seen
            this.scene.visible = true;
        }
        this.renderingLoopHooks.push(update_ar)

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