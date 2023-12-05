import cv, { type Mat } from 'opencv-ts'


export const useCvEngine = (): CvEngine => {
    return CvEngine.getSingleton();
}

//デリゲートの定義
export interface CvEngineDelegate {
    //opencv.jsの初期化終了時に呼び出し
    onInitialized?(): void;
    // ビデオフレームが処理可能になり、画像処理が行われる直前に呼び出される。メソッドは処理済みのMatを返す必要がある
    // ここでキャプチャ画像に常に行いたい事前処理を行うことができる
    preprocessFrame?(img: Mat): Mat;
}

// 実行頻度を制限するクラス
class RateLimiter {
    private lastExecutionTime: number = 0;
    private readonly interval: number; //milli seccond

    constructor(interval_millisec: number) {
        this.interval = interval_millisec;
    }

    //引数で与えた関数の実行頻度が制限される（intervalミリ秒に一度以下となる）
    execute(callback: () => void) {
        const currentTime = Date.now();
        if (currentTime - this.lastExecutionTime >= this.interval) {
            callback();
            this.lastExecutionTime = currentTime;
        }
    }
}

const rate_limiter = new RateLimiter(500); //500ミリ秒につき一度以上実行しない

export class CvEngine {
    delegate?: CvEngineDelegate;
    inputCanvas: HTMLCanvasElement = document.createElement('canvas'); //オフラインキャンバス
    initiallized = false;

    userProcessor?: (img: Mat) => void;

    //シングルトンを作る（インスタンスがアプリケーション内で唯一であることを保証する）
    private static instance: CvEngine | null = null;
    public static getSingleton(): CvEngine {
        if (!CvEngine.instance) {
            CvEngine.instance = new CvEngine();
        }
        return CvEngine.instance;
    }

    private constructor() {
    }

    //初期化。初期に一度だけ呼び出す必要
    init() {
        cv.onRuntimeInitialized = () => {
            this.delegate?.onInitialized?.();
            this.initiallized = true;
        }
        //処理するビデオフレームのサイズ。重い場合は小さくする
        this.inputCanvas.width = 1024;
        this.inputCanvas.height = 768;
    }

    setFrameProcessor(func: (img: Mat) => void) {
        this.userProcessor = func;
    }

    clearFrameProcessor() {
        this.userProcessor = undefined;
    }

    //フレームの処理。カメラ画像をキャプチャするたびに呼び出す必要がある
    processsVideoFrame(video: HTMLVideoElement) {
        if (!this.initiallized) return;

        //実行頻度を下げる(rate_limitter)
        rate_limiter.execute(() => {
            /* VideoElementから直接画像を得ることはできないので、
               VideoElement -> Canvas にコピーする。
               その後、各種ハンドラに処理を引き継ぐ
            */
            let canvas = this.inputCanvas;
            let context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height); //コピー
                let img = cv.imread(canvas); //canvasの画像からopencvのMatを作る

                if (this.delegate?.preprocessFrame) {
                    img = this.delegate?.preprocessFrame?.(img);
                }

                this.userProcessor?.(img); //ユーザのハンドラを呼び出す
                img.delete();
            } else {
                console.log("error on canvas.getContext('2d') in CvEngine.processsVideoFrame");
                return;
            }
        })


    }
}