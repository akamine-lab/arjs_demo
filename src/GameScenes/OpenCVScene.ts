import { type GameScene } from '@/GameEngine'
import { useCvEngine } from '@/CvEngine';
import cv, { type Mat } from 'opencv-ts';
import { Change3DScene } from './Change3DScene';

const cv_engine = useCvEngine();

function posterize(image: Mat): Mat {
    // 階調数を指定（例: 8階調）
    const levels = 8;

    // ポスタリゼーションを実行
    const posterizedImage = new cv.Mat();
    const ones = new cv.Mat(image.rows, image.cols, cv.CV_8UC3, new cv.Scalar(1, 1, 1));
    cv.multiply(image, ones, posterizedImage, 0.125);
    cv.multiply(posterizedImage, ones, posterizedImage, 8);
    ones.delete();

    return posterizedImage;
}
export class OpenCVScene implements GameScene {
    nextScene: GameScene | null = null;

    init(): void {
        this.useEdgeFilter(); //エッジフィルタモードに設定
    }

    useEdgeFilter() {
        cv_engine.setFrameProcessor((img: Mat) => {
            this.edgeDetect(img);
        });
    }

    useAnimeFilter() {
        cv_engine.setFrameProcessor((img: Mat) => {
            this.animeFilter(img);
        });
    }

    edgeDetect(img: Mat) {

        let resized = new cv.Mat();
        cv.resize(img, resized, new cv.Size(640, 480));

        // 画像をグレースケールに変換
        const grayImage = new cv.Mat();
        cv.cvtColor(resized, grayImage, cv.COLOR_BGR2GRAY);

        // エッジを検出
        const edges = new cv.Mat();
        cv.Canny(grayImage, edges, 50, 150); // パラメータは調整可能

        this.show(edges);

        resized.delete();
        grayImage.delete();
        edges.delete();

    }

    animeFilter(img: Mat) {
        const resized = new cv.Mat();
        cv.resize(img, resized, new cv.Size(640, 480));

        // カラー画像を取得(BGRA to BGR)
        const bgr = new cv.Mat();
        cv.cvtColor(resized, bgr, cv.COLOR_BGRA2BGR);
        resized.delete();

        // カラー画像をグレースケールに変換
        const gray = new cv.Mat();
        cv.cvtColor(bgr, gray, cv.COLOR_BGR2GRAY);

        // エッジを検出する（Cannyエッジ検出を使用）
        const edges = new cv.Mat();
        // cv.Canny(gray, edges, 100, 100);
        cv.adaptiveThreshold(gray, edges, 255,
            cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY,
            11, 5.0);

        // ノイズ除去
        cv.GaussianBlur(edges, edges, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // BGRに戻す
        cv.cvtColor(edges, edges, cv.COLOR_GRAY2BGR);

        // ペイント風に
        let paint = new cv.Mat();

        let M = new cv.Mat.ones(5, 5, cv.CV_8U);
        cv.erode(bgr, paint, M);

        paint = posterize(paint);

        //両者を合成
        const result = new cv.Mat();
        cv.bitwise_and(paint, edges, result);

        this.show(result);

        // メモリの解放(imgは解放しない(ライブラリ側でやっている）)
        gray.delete();
        edges.delete();
        paint.delete();
        result.delete();
        M.delete();
    }

    show(img: Mat) {
        const out_canvas = document.getElementById('test_canvas') as HTMLCanvasElement;
        out_canvas.hidden = false;
        cv.imshow(out_canvas, img);
    }

    update(duration_sec: number): GameScene | null {
        return this.nextScene;
    }

    //後片付け
    end(): void {
        cv_engine.clearFrameProcessor();
        const out_canvas = document.getElementById('test_canvas') as HTMLCanvasElement;
        out_canvas.hidden = true;
    }
    name(): string { return "OpenCVScene" }

    next() {
        //次のupdateのタイミングでシーンを遷移遷移させる
        this.nextScene = new Change3DScene();
    }
}