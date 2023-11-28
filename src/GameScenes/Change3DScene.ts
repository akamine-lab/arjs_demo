import { type GameScene } from '@/GameEngine'
import { useAREngine } from '@/AREngine';
import { TestScene, TestScene2 } from '@/Scene3D';
import { TimerScene } from '@/GameScenes/TimerScene';
import { useGameEngine } from '@/GameEngine';

const ar_engine = useAREngine();

export class Change3DScene implements GameScene {
    name(): string { return "Change3DScene" }

    model1() {
        ar_engine.replaceScene(new TestScene);
    }

    model2() {
        ar_engine.replaceScene(new TestScene2);
    }

    back() {
        const game_engine = useGameEngine();
        game_engine.changeScene(new TimerScene);
    }
};
