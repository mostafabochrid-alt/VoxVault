import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// منع البحث عن النماذج محلياً واستخدام CDN
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;

self.onmessage = async (e) => {
    if (e.data.type === 'transcribe') {
        try {
            self.postMessage({ status: 'init' });

            // تحميل النموذج (أول مرة فقط)
            if (!transcriber) {
                transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
                    progress_callback: (info) => {
                        self.postMessage({
                            status: 'progress',
                            file: info.file,
                            progress: info.progress
                        });
                    }
                });
            }

            self.postMessage({ status: 'processing' });

            // استخدام AudioContext لفك تشفير الصوت (يجب تحويله إلى Float32Array)
            // بما أن Worker لا يدعم AudioContext، نرسل البيانات كما هي لنموذج transformers الذي يعالج الملفات الخام أو نقوم بمعالجتها.
            // نموذج Whisper في Transformers.js يقبل ملفات Audio كـ ArrayBuffer مباشرة
            const result = await transcriber(new Uint8Array(e.data.audio));

            self.postMessage({ status: 'done', text: result.text });

        } catch (error) {
            console.error('Transcription error:', error);
            self.postMessage({ status: 'error', message: error.message });
        }
    }
};

