
import { BehaviorSubject, Subject, scan, map, takeUntil, share } from 'rxjs';
import { BackendType, RoomMetadata, TokenResult } from '../types';
export type curState = {
    join: boolean
    isAdmin: boolean,
    roomName?: string,
    hassPass?: boolean,
    roomMetadata?: RoomMetadata,
    token?: TokenResult,
    backend?: BackendType
}

export const curState$ = new BehaviorSubject<curState>({
    join: false,
    isAdmin: false,
    roomName: '',
    hassPass: false,
    roomMetadata: undefined,
    token: undefined as TokenResult | undefined,
    backend: undefined
});

// 创建共享数据流
export const sharedCurState$ = curState$.pipe(
    share()
  );