<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { onErrorCaptured, onMounted, reactive, ref } from 'vue';
import { useAREngine, type AREngineDelegate } from "./AREngine";
import ChangeScene from './ChangeScene.vue';
import useLogger from './logger';
import type { Matrix4 } from 'three';
import type { ArMarkerControls } from '@ar-js-org/ar.js-threejs/types/ArMarkerControls';

import { TestMain } from './TestMain';
import { GameScene1 } from './GameScene';

const testmain = new TestMain();
testmain.test();

testmain.update();

testmain.changeScene(new GameScene1());
testmain.update();

const log = useLogger();
const video_canvas = "threejs"

onErrorCaptured((err, instance, info) => {
  log.error(err, info);
});

class AREventHandler implements AREngineDelegate {
  onMarkerFound(marker: ArMarkerControls): void {
    //マーカーが見つかった時の処理
  }
}

// const ar_engine = useAREngine(); //WebARクラスの唯一のインスタンスを取得
// ar_engine.delegate = new AREventHandler();

// //本モジュールが表示可能な状態になった直後に実行される
// onMounted(() => {
//   //webarの初期化
//   ar_engine.start(video_canvas);
// })


</script>


<template>
  <main>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
    <HelloWorld msg="You did it!" />
    <ChangeScene></ChangeScene>
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
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
./AREngine