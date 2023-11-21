import type GameScene from './GameScene';

export class TestMain {

    gameScene?: GameScene;

    changeScene(new_scene: GameScene) {
        new_scene.init();
        this.gameScene = new_scene;
    }

    test(): void {
        console.log(this.gameScene);
    }

    update(): void {
        this.gameScene?.update(1);
        console.log("TestMain.update()");
    }
}
