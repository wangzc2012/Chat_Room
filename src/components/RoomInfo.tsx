import { useObservableState } from "@/livekit-react-offical/hooks/internal";
import type { RoomInfo } from "@/pages/api/info";
import { useCallback, useEffect, useMemo, useState } from "react";
import { setIntervalAsync, clearIntervalAsync } from "set-interval-async";
import { roominfo$ } from "../lib/observe/RoomInfoObs";
import { curState, curState$ } from "@/lib/observe/CurStateObs";
import { useRoomInfo } from "@/lib/hooks/useRoomInfo";
import { useTranslation } from "react-i18next";
import { useBackend } from '@/lib/client-utils';
import { useCurState } from "@/lib/hooks/useCurState";
type Props = {
    roomName: string;
    join?: boolean
};

const DEFAULT_ROOM_INFO: RoomInfo = { num_participants: 0, hasPasswd: false, maxParticipants: 0 };

export function RoomInfo({ roomName, join }: Props) {
    const [roomInfo, setRoomInfo] = useState<RoomInfo>(DEFAULT_ROOM_INFO);
    const {prevBackend} = useBackend();
    const roominfo_after_enter = useRoomInfo()
    const { t, i18n } = useTranslation()
    const mcurState = useCurState()
    useEffect(() => {
        console.log('Current prevBackend:', prevBackend); // 调试用
    }, [prevBackend]);
    

    const fetchRoomInfo = useCallback(async () => {
        
            if(!prevBackend?.label) return
            const res = await fetch(`/api/info?backendLabel=${prevBackend.label}&roomName=${roomName}`);
            const _roomInfo = (await res.json()) as RoomInfo;
            
            setRoomInfo(_roomInfo);
            if(_roomInfo.hasPasswd != roomInfo.hasPasswd){
                curState$.next({...mcurState, hassPass: _roomInfo.hasPasswd})
            }
        // }
    }, [roomName, prevBackend?.label, roomInfo.hasPasswd]);

    const humanRoomName = useMemo(() => {
        return decodeURI(roomName);
    }, [roomName]);
    
    useEffect(() => {
        if(!roomName) return
        if(join != undefined && join) {
            setRoomInfo({num_participants: roominfo_after_enter.participant_num,
                hasPasswd: roominfo_after_enter.passwd != undefined &&  roominfo_after_enter.passwd != "",
                maxParticipants: roominfo_after_enter.max_participant_num
            })
        }else{
            fetchRoomInfo()
            const interval = setIntervalAsync(fetchRoomInfo, 5000);
            return () => {
                clearIntervalAsync(interval);
            };
        }
    }, [join, roominfo_after_enter, fetchRoomInfo ]);
    
    if(!roomName) return <div></div>

    return (
        <div className="flex flex-col w-full space-y-2">

            <div className="flex justify-center w-full space-x-2">
                <div className="flex flex-col items-center">
                    <span className="text-lg text-nowrap">
                    {t('room.roomName')}
                    </span>

                    <span className=" font-bold text-6xl font-mono">{humanRoomName}</span>

                </div>
            </div>
            <div className="flex justify-around w-full space-x-4">
                <div className="pl-2  flex flex-col items-center">
                    <span className="text-lg text-nowrap">
                    {t('room.membersNum')}
                    </span>

                    <span className=" text-6xl font-mono countdown">
                        <span  style={{ "--value": roomInfo? roomInfo.num_participants: 0 } as any}></span>
                    </span>
                </div>
                {
                    roomInfo.maxParticipants > 0 && (
                    <div className="pl-2  flex flex-col items-center">
                        <span className="text-lg">
                            {t('room.capacity')}
                        </span>

                        <span className=" text-6xl font-mono countdown">
                            <span  style={{ "--value": roomInfo.maxParticipants } as any}></span>
                        </span>
                    </div>
                    )
                }

                {
                roomInfo.hasPasswd && (
                    <div className="pl-2 flex flex-col justify-center items-center">
                        <span className="text-lg text-primary ">
                            ⚠️
                        </span>
                        <span className="text-lg ">
                            {t('room.needPasswd')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}