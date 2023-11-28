<script setup lang="ts">
import { useGameEngine } from '@/GameEngine'
import { TimerScene } from '@/GameScenes/TimerScene';
import { ref } from 'vue';

/*
TimeSceneに関連するview。シーンが遷移すると自動で遷移先シーンに関連するvueコンポーネントに切り替わる
*/
const scene = useGameEngine().scene as TimerScene;

const remaining_time = ref(0); //リアクティブな変数

if (scene) {
    //シーンないのタイマーが変更された時に呼び出される
    scene.onTimerUpdated = () => {
        //タイマーの変更に合わせて、uiの表示を変更する
        remaining_time.value = Math.floor(scene.remainingTime());
    }
} else {
    console.log("scene propが設定されていない");
}
</script>

<template>
    <h1> 時間経過で遷移するシーンの例...遷移まで {{ remaining_time }}秒</h1>
</template>

<style scoped>
h1 {
    font-weight: 500;
    font-size: 2.6rem;
    color: black;
}
</style>
