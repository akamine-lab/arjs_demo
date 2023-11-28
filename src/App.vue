<script setup lang="ts">
import { onErrorCaptured, onMounted, reactive, ref, type Component } from 'vue';
import { useAREngine, type AREngineDelegate } from "./AREngine";

import useLogger from './logger';
import type { Matrix4, Renderer } from 'three';
import type { ArMarkerControls } from '@ar-js-org/ar.js-threejs/types/ArMarkerControls';
import { type GameScene, type GameEngineDelegate, EmptyScene, useGameEngine } from './GameEngine';

import Timer from './components/Timer.vue';
import Change3DScene from './components/Change3DScene.vue';

const log = useLogger();//ブラウザ上に表示するカスタムロガー
const video_canvas = "threejs" //ビデオ画像を表示するDOM

const scene_name = ref(""); //シーンの変更をcomponentに伝えるためのリアクティブ変数

interface ComponentDict {
  [index: string]: Component
}

//シーン名とvueコンポーネントを対応付ける辞書
const components_dict: ComponentDict = {
  "Timer": Timer,
  "Change3DScene": Change3DScene
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

class AREventHandler implements AREngineDelegate {
  onMarkerFound(marker: ArMarkerControls): void {
    //マーカーが見つかった時の処理
  }
  onFrameCaptured(video_element: HTMLVideoElement): void {
    //ビデオフレームが更新された時に呼び出される

    // var canvas = document.getElementById("test_canvas") as HTMLCanvasElement;
    // var context = canvas!.getContext('2d');
    // context!.drawImage(video_element, 0, 0, canvas.width, canvas.height);
  }
  onRender(renderer: Renderer, duration_sec: number): void {
    game_engine.update(duration_sec);
  }
}

const ar_engine = useAREngine(); //WebARクラスの唯一のインスタンスを取得
ar_engine.delegate = new AREventHandler();


//本モジュールが表示可能な状態になった直後に実行される
onMounted(() => {
  //webarの初期化
  ar_engine.setupRenderer(video_canvas);
  //ar_engine.startAR(); //ここをコメントアウトすると非ARで起動する
  game_engine.init();
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
