<script setup lang="ts">
import { OpenCVScene } from '@/GameScenes/OpenCVScene';
import { useGameEngine } from '@/GameEngine';

// 関連するゲームシーンを得る
const scene = useGameEngine().scene as OpenCVScene;

/*
view(vueのコンポーネント)と、他のクラスの依存関係をなるべく減らす。
基本的には、関連するGameSceneにのみメッセージを送る
*/

const next = () => {
    scene.next();
}

const useEdgeFilter = () => {
    scene.useEdgeFilter();
}

const useAnimeFilter = () => {
    scene.useAnimeFilter();
}
</script>

<template>
    <h1>OpenCVデモシーン</h1>
    <button @click="useEdgeFilter">Edge filter</button>
    <button @click="useAnimeFilter">Anime filter</button>
    <button @click="next">Go to next scene</button>
</template>./AREngine

<style scoped>
h1 {
    font-weight: 500;
    font-size: 2.6rem;
    color: black;
    background-color: white;
}
</style>