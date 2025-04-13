import {
  LiveKitRoom,
  //   PreJoin,
  //   LocalUserChoices,
  //   VideoConference,
  useToken,
  formatChatMessageLinks,
} from '@livekit/components-react';
import { MyErrorToast } from '@/components/Toast';
import { VideoConference } from '@/components/MyVideoConference';
import { LogLevel, RoomOptions, ExternalE2EEKeyProvider, Room } from 'livekit-client';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DebugMode } from '../../lib/Debug';
import { PreJoin, LocalUserChoices } from '@/components/MyPreJoin';
import { useServerUrls } from '../../lib/client-utils';
import { log } from '@livekit/components-core';
import { defaultAudioSetting, publishDefaults } from '@/lib/const';
import { RoomHistryType, TokenResult } from '@/lib/types';
import { curState, curState$ } from '@/lib/observe/CurStateObs';
import { WebAudioContext } from '@/lib/context/webAudioContex';
import { useSetContext } from '@/lib/context/setContext';
import { useTranslation } from 'react-i18next';
import { useCurState } from '@/lib/hooks/useCurState';
import { formatter } from '@/lib/chat-utils/formatter';
import { useBackend } from '@/lib/client-utils';
log.setDefaultLevel(LogLevel.warn);
const Home: NextPage = () => {
  const router = useRouter();
  const { name: roomName } = router.query;

  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  const [defaultOpt, setDefaultOpt] = useState({
    username: '',
    audioEnabled: true,
    audioDeviceId: '',
    passwd: '',
    backend: undefined as any
  });
  const {backends} = useBackend();
  useEffect(() => {
    //  获取url中query参数
    const { passwd, username, backend } = router.query;
    if(passwd || username || backend){
        const ttt = {
            ...defaultOpt,
            passwd: passwd as string,
            username: username as string, 
            backend: backends.find((item) => item.label === backend)
            }
        setDefaultOpt(ttt)
    }
  }, [router, backends]);

  return (
    <>
      <Head>
        <title>QST Chat Room</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {roomName && !Array.isArray(roomName) && preJoinChoices ? (
          <ActiveRoom
            roomName={roomName}
            userChoices={preJoinChoices}
            onLeave={() => {
              curState$.next({
                join: false,
                isAdmin: false,
              });
              router.push('/');
            }}
          ></ActiveRoom>
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <PreJoin
              roomName={roomName as string}
              onError={(err) => console.log('error while setting up prejoin', err)}
              defaults={defaultOpt}
              onSubmit={(values) => {
                console.log('Joining with: ', values);
                setPreJoinChoices(values);
              }}
            ></PreJoin>
          </div>
        )}
      </main>
    </>
  );
};

export default Home;

type ActiveRoomProps = {
  userChoices: LocalUserChoices;
  roomName: string;
  region?: string;
  onLeave?: () => void;
};
const ActiveRoom = ({ roomName, userChoices, onLeave }: ActiveRoomProps) => {
  const { t, i18n } = useTranslation();
  // const toast = useRef<HTMLDivElement>(null);
  //get token
  const [token, setToken] = useState<TokenResult | undefined>(undefined);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const { ctx } = useSetContext();
  const mcurState = useCurState()
  const fetchToken = useCallback(
    async (roomName: string) => {
      if (roomName === undefined) return undefined;
      if (!process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT) return undefined;
      const body = {
        identity: userChoices.username,
        name: userChoices.username,
        passwd: userChoices.passwd,
        roomName: roomName,
        backendLabel: userChoices.backend?.label,
      };
      const response = await fetch(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.status === 200) {
        const token = (await response.json()) as TokenResult;
        curState$.next({
            ...mcurState,
            token: token
        })
        setToken(token);
        return token;
      }

      const { error } = await response.json();
      throw error;
    },
    [roomName, userChoices.passwd, userChoices.username, mcurState],
  );

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    if (ctx) {
      setAudioContext(ctx);
    }
    return () => {
      setAudioContext((prev) => {
        return null;
      });
    };
  }, [ctx]);

  useEffect(() => {
    fetchToken(roomName).catch((e) => {
      console.log(e);
      setShowError(true);
      setErrorMsg(e);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }).then(() => {
        // 保存会议信息
        let his: RoomHistryType[] = JSON.parse(localStorage.getItem('roomHistory') || JSON.stringify([]));
        while(his.length > parseInt(process.env.NEXT_PUBLIC_MAX_HISTORY_ROOMS || "6") ){
            his.shift();
        }
        // 清理同名会议
        his = his.filter((item) => item.roomName !== roomName);
        his.push({
            roomName: roomName,
            passwd: userChoices.passwd,
            username: userChoices.username,
        })
        localStorage.setItem('roomHistory', JSON.stringify(his));
    });
  }, [roomName]);

  const router = useRouter();
  const { hq } = router.query;


  const roomOptions = useMemo((): RoomOptions => {
    let setting: RoomOptions = {
      audioCaptureDefaults: {
        deviceId: userChoices.audioDeviceId ?? undefined,
        ...defaultAudioSetting,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      publishDefaults: publishDefaults,
      e2ee: undefined,
    };

    if (audioContext) setting = { ...setting };
    return setting;
  }, [userChoices, hq, audioContext]);

  // using e2ee
  const keyProvider = useMemo(() => new ExternalE2EEKeyProvider(), []);
  
  const room = useMemo(() => {
    if(process.env.NEXT_PUBLIC_DISABLE_E2EE === 'true' || !userChoices.passwd){
        roomOptions.e2ee = undefined;
    }

    keyProvider.setKey(userChoices.passwd);

    const opt =
      typeof window !== 'undefined'
        ? {
            keyProvider,
            worker: new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)),
          }
        : undefined;
    roomOptions.e2ee = opt;
    const r = new Room(roomOptions)
    !!roomOptions.e2ee && r.setE2EEEnabled(true);
    return r;
  }, [userChoices.passwd, keyProvider]);

  return (
    <div className="w-full top-16 relative" style={{ height: 'calc(100% - 4rem)' }}>
      {userChoices?.backend?.url && audioContext && (
        <LiveKitRoom
          token={token?.accessToken}
          serverUrl={userChoices.backend.url}
          room={room}
          //   options={roomOptions}
          video={false}
          audio={userChoices.audioEnabled}
          onDisconnected={onLeave}
          data-lk-theme="default"
        >
          <WebAudioContext.Provider value={audioContext}>
            <VideoConference chatMessageFormatter={formatter} />
          </WebAudioContext.Provider>
          <DebugMode logLevel={LogLevel.warn} />
        </LiveKitRoom>
      )}

      {/* toast */}
      {showError && <MyErrorToast>{t(errorMsg)}</MyErrorToast>}
    </div>
  );
};
