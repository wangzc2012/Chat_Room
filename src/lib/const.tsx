import { VideoPresets, TrackPublishDefaults, TrackPublishOptions, ScreenSharePresets, AudioPresets, VideoPreset } from 'livekit-client';
import { AudioSetting } from './types';
let t = 0
export const presets = [{
    w: 1280,
    h: 720,
    bitrate: 3_000_000,
    fps: 30,
    nickname: '720p30',
    preset: undefined as VideoPreset | undefined
}, {
    w: 1280,
    h: 720,
    bitrate: 6_000_000,
    fps: 60,
    nickname: '720p60',
    preset: undefined as VideoPreset | undefined
},{
    w: 1920,
    h: 1080,
    bitrate: 10_000_000,
    fps: 60,
    nickname: '1080p60',
    preset: undefined as VideoPreset | undefined
},{
    w: 1920,
    h: 1080,
    bitrate: 20_000_000,
    fps: 60,
    nickname: '1080p60plus',
    preset: undefined as VideoPreset | undefined
},{
    w: 3840,
    h: 2160,
    bitrate: 20_000_000,
    fps: 30,
    nickname: '4k30',
    preset: undefined as VideoPreset | undefined
}
]

if(t === 0){
    for(let i = 0; i < presets.length; i++){
        const p = presets[i]
        p.preset = new VideoPreset(p.w, p.h, p.bitrate, p.fps)
    }
    t++
}

export const simulcast_set = [presets[0].preset, presets[1].preset]
export const defaultAudioSetting: AudioSetting = {
    autoGainControl: true,
    channelCount: 2,
    echoCancellation: true,
    noiseSuppression: true,
    denoiseMethod: {
        speex: false,
        rnn: false,
        krispNoiseDenoise: false
    },
}

export const publishDefaults: TrackPublishDefaults = {
    audioPreset: AudioPresets.musicStereo,
    dtx: true,
    red: true,
    forceStereo: false,
    simulcast: false,
    // videoSimulcastLayers: simulcast_set,
    // screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
    screenShareEncoding: presets[0].preset?.encoding,
    stopMicTrackOnMute: false,
    videoEncoding: presets[0].preset?.encoding,
    videoCodec: 'vp8',
    backupCodec: { codec: 'vp8', encoding: VideoPresets.h720.encoding },
} as const;

// export const lru = {lru: new LRUCache({ max: 500, ttl:1000 * 60 * 60 * 24 }), time:  new Date() }
export const theme = {
    color1: "#9DC8C8",
    color2: "#58C9B9",
    color3: "#519D9E",
    color4: "#D1B6E1",
}

export const speexWorkletPath = "/denoise/speex/workletProcessor.js"
export const speexWasmPath = "/denoise/speex/speex.wasm"
export const rnnWorkletPath = "/denoise/rnn/workletProcessor.js"
export const rnnoiseWasmPath = "/denoise/rnn/rnnoise.wasm"
export const rnnoiseWasmSimdPath = "/denoise/rnn/rnnoise_simd.wasm"
