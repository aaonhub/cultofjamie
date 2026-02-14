export class FlashbangSound {
    private ctx: AudioContext | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
    }

    private createNoiseBuffer() {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playThrow() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.3);
    }

    playBounce() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const t = ctx.currentTime;

        // Metallic clank: multiple oscillators
        [800, 1200, 2500].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 0.1);
        });
    }

    playExplosion() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        // 1. The Bang (White Noise)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        const noiseGain = this.ctx.createGain();

        noiseGain.gain.setValueAtTime(1, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(t);

        // 2. The Ring (Lower pitch, shorter duration, less piercing)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2500, t); // Lower frequency (was 5000)

        oscGain.gain.setValueAtTime(0.15, t); // Quieter (was 0.3)
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5); // Faster decay

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 1.5);

        // 3. Low Thud
        const thud = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();

        thud.type = 'sine';
        thud.frequency.setValueAtTime(100, t);
        thud.frequency.exponentialRampToValueAtTime(10, t + 0.5);

        thudGain.gain.setValueAtTime(0.8, t);
        thudGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        thud.connect(thudGain);
        thudGain.connect(this.ctx.destination);

        thud.start(t);
        thud.stop(t + 0.5);
    }
}
