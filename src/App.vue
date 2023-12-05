<script setup lang="ts">
import { onErrorCaptured, onMounted, ref, type Component } from 'vue';
import { useAREngine, type AREngineDelegate } from "./AREngine";

import type { ArMarkerControls } from '@ar-js-org/ar.js-threejs/types/ArMarkerControls';
import type { Renderer } from 'three';
import { EmptyScene, useGameEngine, type GameEngineDelegate, type GameScene } from './GameEngine';
import useLogger from './logger';

import { useCvEngine, type CvEngineDelegate } from './CvEngine';
import Change3DScene from './components/Change3DScene.vue';
import Timer from './components/Timer.vue';
import OpenCVScene from './components/OpenCVScene.vue';


const log = useLogger();//ブラウザ上に表示するカスタムロガー
const video_canvas = "threejs" //ビデオ画像を表示するDOM

const scene_name = ref(""); //シーンの変更をcomponentに伝えるためのリアクティブ変数

interface ComponentDict {
  [index: string]: Component
}

//シーン名とvueコンポーネントを対応付ける辞書
const components_dict: ComponentDict = {
  "Timer": Timer,
  "Change3DScene": Change3DScene,
  "OpenCVScene": OpenCVScene
}

onErrorCaptured((err, instance, info) => {
  log.error(err, info);
});

const current_scene = ref<GameScene>(new EmptyScene)

class GameEventHandler implements GameEngineDelegate {
  onSceneChanged(current_scene: GameScene): void {
    if (current_scene.name) {
      scene_name.value = current_scene.name();
    }
  }
}

const game_engine = useGameEngine(); // 唯一のゲームエンジンインスタンスを取得
game_engine.delegate = new GameEventHandler();

const cv_engine = useCvEngine(); //唯一のopencvエンジンインスタンスを取得
class CvEngineHandler implements CvEngineDelegate {
  onInitialized(): void {
    console.log("opencv intialized");
  }
};

cv_engine.delegate = new CvEngineHandler();

class AREventHandler implements AREngineDelegate {
  onMarkerFound(marker: ArMarkerControls): void {
    //マーカーが見つかった時の処理
  }
  onFrameCaptured(video_element: HTMLVideoElement): void {
    //ビデオフレームが更新された時に呼び出される

    //ここでarjsがキャプチャするビデオをopencv_enineに渡す
    cv_engine.processsVideoFrame(video_element);
  }
  onRender(renderer: Renderer, duration_sec: number): void {
    game_engine.update(duration_sec);
  }
}

const ar_engine = useAREngine(); //WebARクラスの唯一のインスタンスを取得
ar_engine.delegate = new AREventHandler();


//本モジュールが表示可能な状態になった直後に実行される
onMounted(() => {
  //opencvの初期化
  //webarの初期化
  ar_engine.setupRenderer(video_canvas);
  ar_engine.startAR(); //ここをコメントアウトすると非ARで起動する
  game_engine.init();
  cv_engine.init();
})

</script>


<template>
  <main>
    <p>シーン名:{{ scene_name }}</p>
    <!-- 対応するコンポーネントに切り替える -->
    <component :is="components_dict[scene_name]" />
  </main>
</template>

<style scoped>
#webar {
  /* display: flex;
  align-items: end; */
  position: fixed;
  bottom: 0;
}

main {
  /* background-color: red; */
  height: 100%;
  color: black;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
./CvEngine