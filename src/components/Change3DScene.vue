<script setup lang="ts">
import { Change3DScene } from '@/GameScenes/Change3DScene';
import { useGameEngine } from '@/GameEngine';

// 関連するゲームシーンを得る
const scene = useGameEngine().scene as Change3DScene;

/*
view(vueのコンポーネント)と、他のクラスの依存関係をなるべく減らす。
基本的には、関連するGameSceneにのみメッセージを送る
*/

if (!scene) {
    console.log("シーンオブジェクトが取得できない");
}

const model1 = () => {
    scene.model1();
}

const model2 = () => {
    scene.model2();
}

const back = () => {
    scene.back();
}
</script>

<template>
    <h1>3DモデルをUIにより動的に変更するシーン</h1>
    <button @click="back">back</button>
    <button @click="model1">model1</button>
    <button @click="model2">model2</button>
</template>./AREngine