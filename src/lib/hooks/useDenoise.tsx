import { useObservableState } from "@/livekit-react-offical/hooks/internal";

import { denoiseMethod$ } from "../observe/DenoiseMethodObs";

export function useDenoiseMethod() {
    // 直接获取当前值
    const getCurrentState = () => denoiseMethod$.value;
    // 保持响应式更新
    const mcurState = useObservableState(denoiseMethod$, getCurrentState());
    
    return mcurState
}

