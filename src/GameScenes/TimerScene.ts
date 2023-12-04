import { type GameScene } from '@/GameEngine'
import { Change3DScene } from './Change3DScene'
import { OpenCVScene } from './OpenCVScene'

export class TimerScene implements GameScene {
    sceneTime: number = 0;
    onTimerUpdated?: () => void;

    remainingTime(): number {
        return Math.max(0, 3 - this.sceneTime);
    }
    update(duration_sec: number) {
        if (this.remainingTime() <= 0) {
            return new OpenCVScene();
        }
        this.sceneTime += duration_sec;
        this.onTimerUpdated?.();
        return null;
    }
    name(): string { return "Timer" }
}