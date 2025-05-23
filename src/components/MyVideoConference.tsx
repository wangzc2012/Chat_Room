import type {
    MessageDecoder,
    MessageEncoder,
    TrackReferenceOrPlaceholder,
    WidgetState,
  } from '@livekit/components-core';
  import { isEqualTrackRef, isTrackReference, isWeb, log } from '@livekit/components-core';
  import { RoomEvent, Track } from 'livekit-client';
  import * as React from 'react';
  import { useTracks, usePinnedTracks, LayoutContextProvider,
    FocusLayoutContainer,
    ConnectionStateToast, MessageFormatter, useCreateLayoutContext,
//  Chat, 
    CarouselLayout,
//  FocusLayout,
    GridLayout,
    useRoomContext,
    useParticipants,
//  ParticipantTile,
//  RoomAudioRenderer,
//  ControlBar,
} from '@livekit/components-react';
//   import { useWarnAboutMissingStyles } from '../hooks/useWarnAboutMissingStyles';

import {ControlBar} from "@/components/MyControlBar";
import {FocusLayout} from "@/components/MyFocusLayout";
import {Chat} from "@/components/MyChat";
import {ParticipantTile} from "@/components/MyParticipantTile";
import {RoomAudioRenderer} from "@/components/MyRoomAudioRenderer";
import { curState, curState$ } from '@/lib/observe/CurStateObs';
import { RoomInfoUseForParticipant, roominfo$ } from '@/lib/observe/RoomInfoObs';
import { useCurState } from '@/lib/hooks/useCurState';
import { useIsShareVideo } from '@/lib/hooks/useIsShareVideo';
import { VideoShareTile } from './VideoShare/VideoShareTile';
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';
import { denoiseMethod$ } from '@/lib/observe/DenoiseMethodObs';
import { defaultAudioSetting } from '@/lib/const';
import { useObservableState } from '@/livekit-react-offical/hooks/internal';
import { DenoiseMethod } from '@/lib/types';
import { useDenoiseMethod } from '@/lib/hooks/useDenoise';
  /**
   * @public
   */
  export interface VideoConferenceProps extends React.HTMLAttributes<HTMLDivElement> {
    chatMessageFormatter?: MessageFormatter;
    chatMessageEncoder?: MessageEncoder;
    chatMessageDecoder?: MessageDecoder;
    /** @alpha */
    SettingsComponent?: React.ComponentType;
  }
  
  /**
   * The `VideoConference` ready-made component is your drop-in solution for a classic video conferencing application.
   * It provides functionality such as focusing on one participant, grid view with pagination to handle large numbers
   * of participants, basic non-persistent chat, screen sharing, and more.
   *
   * @remarks
   * The component is implemented with other LiveKit components like `FocusContextProvider`,
   * `GridLayout`, `ControlBar`, `FocusLayoutContainer` and `FocusLayout`.
   * You can use these components as a starting point for your own custom video conferencing application.
   *
   * @example
   * ```tsx
   * <LiveKitRoom>
   *   <VideoConference />
   * <LiveKitRoom>
   * ```
   * @public
   */
  export function VideoConference({
    chatMessageFormatter,
    SettingsComponent,
    ...props
  }: VideoConferenceProps) {
    const [widgetState, setWidgetState] = React.useState<WidgetState>({
      showChat: false,
      unreadMessages: 0,
      showSettings: false,
    });
    const lastAutoFocusedScreenShareTrack = React.useRef<TrackReferenceOrPlaceholder | null>(null);
    
    // change by cwy
    const denoiseMethod = useDenoiseMethod()
    const room = useRoomContext()
    const participants = useParticipants()
    const sourceArrs = []
    if(process.env.NEXT_PUBLIC_USE_VIDEO === "true"){
        sourceArrs.push({ source: Track.Source.Camera, withPlaceholder: true })
    }else{
        sourceArrs.push({ source: Track.Source.Microphone, withPlaceholder: false })
    }
    if(process.env.NEXT_PUBLIC_USE_SCREEN === "true"){
        sourceArrs.push({  source: Track.Source.ScreenShare, withPlaceholder: false })
    }
    const tracks = useTracks(
      sourceArrs,
      { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
    );

    const widgetUpdate = (state: WidgetState) => {
      log.debug('updating widget state', state);
      setWidgetState(state);
    };


    // 降噪方法
    const { isNoiseFilterEnabled, setNoiseFilterEnabled, isNoiseFilterPending } =  useKrispNoiseFilter();
    React.useEffect(() => {
        // 只有livekit.cloud才能使用Krisp降噪
        if(process.env.NEXT_PUBLIC_IS_USE_CLOUD !== 'true') return
        const denoiseMethodStr = localStorage.getItem('denoiseMethod')
        
        const denoiseMethodObj: DenoiseMethod = denoiseMethodStr ? JSON.parse(denoiseMethodStr) : {...defaultAudioSetting.denoiseMethod}
        // enable Krisp by default
        setNoiseFilterEnabled(denoiseMethodObj.krispNoiseDenoise);
        console.log('update Krisp', denoiseMethodObj.krispNoiseDenoise)
      }, [denoiseMethod.krispNoiseDenoise]);

    React.useEffect(() => {
        const denoiseMethodStr = localStorage.getItem('denoiseMethod')
        
        const denoiseMethodObj: DenoiseMethod = denoiseMethodStr ? JSON.parse(denoiseMethodStr) : {...defaultAudioSetting.denoiseMethod}
        denoiseMethod$.next(denoiseMethodObj)
    }, []);  

      
    const layoutContext = useCreateLayoutContext();
  
    const screenShareTracks = tracks
      .filter(isTrackReference)
      .filter((track) => track.publication.source === Track.Source.ScreenShare);
  
    const focusTrack = usePinnedTracks(layoutContext)?.[0];
    const carouselTracks = tracks.filter((track) => !isEqualTrackRef(track, focusTrack));

    React.useEffect(() => {
      // If screen share tracks are published, and no pin is set explicitly, auto set the screen share.
      if (
        screenShareTracks.some((track) => track.publication.isSubscribed) &&
        lastAutoFocusedScreenShareTrack.current === null
      ) {
        log.debug('Auto set screen share focus:', { newScreenShareTrack: screenShareTracks[0] });
        layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: screenShareTracks[0] });
        lastAutoFocusedScreenShareTrack.current = screenShareTracks[0];
      } else if (
        lastAutoFocusedScreenShareTrack.current &&
        !screenShareTracks.some(
          (track) =>
            track.publication.trackSid ===
            lastAutoFocusedScreenShareTrack.current?.publication?.trackSid,
        )
      ) {
        log.debug('Auto clearing screen share focus.');
        layoutContext.pin.dispatch?.({ msg: 'clear_pin' });
        lastAutoFocusedScreenShareTrack.current = null;
      }
      if (focusTrack && !isTrackReference(focusTrack)) {
        const updatedFocusTrack = tracks.find(
          (tr) =>
            tr.participant.identity === focusTrack.participant.identity &&
            tr.source === focusTrack.source,
        );
        if (updatedFocusTrack !== focusTrack && isTrackReference(updatedFocusTrack)) {
          layoutContext.pin.dispatch?.({ msg: 'set_pin', trackReference: updatedFocusTrack });
        }
      }
    }, [
      screenShareTracks
        .map((ref) => `${ref.publication.trackSid}_${ref.publication.isSubscribed}`)
        .join(),
      focusTrack?.publication?.trackSid,
      tracks,
    ]);

      //add cwy 监视当前房间的信息，推送给roominfo$
    const isShareVideo = useIsShareVideo()
    const mcurState = useCurState()
      
      React.useEffect(() => {
        const cus : curState = {
            join: true,
            isAdmin: false
        }
        let metadataObj = undefined
        if(room.metadata != undefined && room.metadata != ""){
            metadataObj = JSON.parse(room.metadata as string)
            cus.roomMetadata = metadataObj
        }
        
        const roominfo : RoomInfoUseForParticipant = {
            room_name: room.name,
            participant_num: participants.length,
            passwd: metadataObj?.passwd,
            max_participant_num: metadataObj?.maxParticipants,
        }
        cus.roomName = room.name
        console.log('metadataObj',room.metadata)
        console.log('update roominfo$', roominfo)
        roominfo$.next(roominfo)
    
    
        const lp = participants[0]
        
        if(lp.metadata != undefined && lp.metadata != ""){
            const met = JSON.parse(lp.metadata as string)
            cus.isAdmin = met.admin
        }
        curState$.next({...mcurState, ...cus})
    }, [participants.length, room.name, room.metadata, room])

  
    // useWarnAboutMissingStyles();
  
    return (
      <div className="lk-video-conference" {...props}>
        {isWeb() && (
          <LayoutContextProvider
            value={layoutContext}
            // onPinChange={handleFocusStateChange}
            onWidgetChange={widgetUpdate}
          >
            <div className="lk-video-conference-inner">
              {!focusTrack  && !isShareVideo ? (
                <div className="lk-grid-layout-wrapper">
                  <GridLayout tracks={tracks}>
                    <ParticipantTile />
                  </GridLayout>
                </div>
              ) : (
                <div className="lk-focus-layout-wrapper">
                  <FocusLayoutContainer>
                    <CarouselLayout tracks={carouselTracks}>
                      <ParticipantTile />
                    </CarouselLayout>
                    {focusTrack && <FocusLayout trackRef={focusTrack} />}
                    {!focusTrack && isShareVideo && mcurState.roomMetadata?.videoShareUrl != undefined && mcurState.roomMetadata?.videoShareUrl != "" &&
                    <VideoShareTile
                        muted={false}
                        sharedUrl={mcurState.roomMetadata?.videoShareUrl}
                        className={`contents lk-participant-tile ${isShareVideo? '': 'hidden'}`}
                    ></VideoShareTile>
                    }
                  </FocusLayoutContainer>
                </div>
              )}
                <ControlBar controls={{ microphone: true, screenShare: !isShareVideo && process.env.NEXT_PUBLIC_USE_SCREEN === "true", 
                camera: process.env.NEXT_PUBLIC_USE_VIDEO === "true", chat: true, shareVideo: process.env.NEXT_PUBLIC_USE_SHAREVIDEO === "true" && !(focusTrack && !isShareVideo) }} />
            </div>
            <Chat
              className='fixed  h-[80%] sm:h-full bottom-[4rem] sm:bottom-auto right-0 sm:right-auto sm:relative rounded-lg shadow-xl bg-info p-2 flex flex-col-reverse'
              style={{ display: widgetState.showChat ? 'flex' : 'none' }}
              messageFormatter={chatMessageFormatter}
            />
            {SettingsComponent && (
              <div
                className="lk-settings-menu-modal"
                style={{ display: widgetState.showSettings ? 'block' : 'none' }}
              >
                <SettingsComponent />
              </div>
            )}
          </LayoutContextProvider>
        )}
        <RoomAudioRenderer />
        <ConnectionStateToast />
      </div>
    );
  }
  