

interface GameScene {
    init(): void
    update(duration: number): void
};


export class GameScene1 implements GameScene {
    init(): void {
        console.log("GameScene1のinit()");
    }

    update(duration: number): void {
        console.log("GameScene1のupdate()");
    }
}


export class GameScene2 implements GameScene {
    init(): void {
        console.log("GameScene2のinit()");
    }

    update(duration: number): void {
        console.log("GameScene2のupdate()");
    }
}