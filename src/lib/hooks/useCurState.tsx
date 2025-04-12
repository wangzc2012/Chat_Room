import { useObservableState } from "@/livekit-react-offical/hooks/internal";
import { useEffect, useState } from "react";
import { curState$, sharedCurState$ } from "../observe/CurStateObs";
import { TokenResult } from "../types";

export function useCurState() {
    // 直接获取当前值
    const getCurrentState = () => curState$.value;
    // 保持响应式更新
    const mcurState = useObservableState(sharedCurState$, getCurrentState());
    
    return mcurState
}

