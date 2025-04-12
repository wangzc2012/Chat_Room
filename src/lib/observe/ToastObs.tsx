
import { BehaviorSubject, Subject, scan, map, takeUntil, share } from 'rxjs';
import { BackendType, RoomMetadata, TokenResult } from '../types';
export type ToastState = {
    isShowToast: boolean,
    TostMsg: string,
    isError: boolean,
}

export const curToastState$ = new BehaviorSubject<ToastState>({
    TostMsg: '',
    isShowToast: false,
    isError: false,
});

// 创建共享数据流
export const sharedCurToastState$ = curToastState$.pipe(
    share()
  );