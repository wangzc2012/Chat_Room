import { useObservableState } from "@/livekit-react-offical/hooks/internal";
import { useEffect, useState } from "react";
import { curState$ } from "../observe/CurStateObs";
import { curToastState$, sharedCurToastState$ } from "../observe/ToastObs";
export type ToastItem = {
    msg: string,
    timeOut: number,
    isError: boolean
}
export function useShowToast() {
    // const [isShowToast, setIsShowToast] = useState(false);
    // const [TostMsg, setTostMsg] = useState<string>("");

    const toastState = useToastState();
    const [msgQueue, setMsgQueue] = useState<ToastItem[]>([]);

    const MAX_QUEUE_SIZE = 5; // 最大队列长度

    const processQueue = (q: ToastItem[]) => {
        if (q.length > 0 && !toastState.isShowToast) {
            const [nextMsg, ...remainingMsgs] = q;
            curToastState$.next({
                ...toastState,
                isShowToast: true,
                TostMsg: nextMsg.msg,
                isError: nextMsg.isError
            });
            
            // 使用函数式更新确保获取最新队列状态
            setMsgQueue(prev => remainingMsgs);
            console.log("remainingMsgs",remainingMsgs);
            
            setTimeout(() => {
                curToastState$.next({
                    ...toastState,
                    isShowToast: false
                });
                setTimeout(() => {
                    // 再次检查并处理队列
                    setMsgQueue(prev => {
                        if (prev.length > 0) {
                            processQueue(prev);
                        }
                        return prev;
                    });
                }, 450)
            }, nextMsg.timeOut);
        }
    };

    const showToast = (msg: string, error = false, timeOut = 2000) => {
        setMsgQueue(prev => {
            // 当队列超过最大长度时，移除最早的消息
            const newQueue = [...prev, {msg, timeOut, isError: error}];
            if (newQueue.length > MAX_QUEUE_SIZE) {
                console.log(newQueue);
                return newQueue.slice(-MAX_QUEUE_SIZE); // 移除队列中的第一个元素
            }
            console.log(newQueue);
            return newQueue;
        });
    };

    useEffect(() => {
        processQueue(msgQueue);
    }, [msgQueue,toastState]);

    return {
        // TostMsg,
        showToast,
        // isShowToast
    };
}


export function useToastState() {
    // 直接获取当前值
    const getCurrentState = () => curToastState$.value;
    // 保持响应式更新
    const mcurState = useObservableState(sharedCurToastState$, getCurrentState());
    
    return mcurState 
}