import { TimerScene } from "./GameScenes/TimerScene";

export interface GameScene {
    init?(): void;
    update?(duration_sec: number): GameScene | null;
    end?(): void;
    name(): string;
};

export interface GameEngineDelegate {
    onSceneChanged?(current_scene: GameScene): void;
}

export class EmptyScene implements GameScene {
    update(duration_sec: number) { return null; }
    name() { return "Empty"; }
}

export const useGameEngine = (): GameEngine => {
    return GameEngine.getSingleton();
}

export class GameEngine {

    scene: GameScene = new EmptyScene();
    delegate?: GameEngineDelegate;

    //シングルトンを作る（インスタンスがアプリケーション内で唯一であることを保証する）
    private static instance: GameEngine | null = null;
    public static getSingleton(): GameEngine {
        if (!GameEngine.instance) {
            GameEngine.instance = new GameEngine();
        }
        return GameEngine.instance;
    }

    private constructor() {
    }

    init() {
        this.changeScene(new TimerScene());
    }

    update(duration_sec: number) {
        const next_scene = this.scene.update?.(duration_sec);

        if (next_scene) {
            this.changeScene(next_scene);
        }
    }

    changeScene(next_scene: GameScene) {
        this.scene.end?.();
        this.scene = next_scene;
        next_scene.init?.();

        this.delegate?.onSceneChanged?.(next_scene);
    }
}