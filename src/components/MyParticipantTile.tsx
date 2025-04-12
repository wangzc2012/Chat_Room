import * as React from 'react';
import type { Participant, TrackPublication } from 'livekit-client';
import { Track } from 'livekit-client';
import type { ParticipantClickEvent, TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { isTrackReference, isTrackReferencePinned, isLocal } from '@livekit/components-core';

import {ParticipantPlaceholder} from '@/livekit-react-offical/assets/images'
import { ScreenShareIcon } from '@/livekit-react-offical/assets/icons';
import LockLockedIcon from './Icons/LockLockedIcon';
import { usePagination, ConnectionQualityIndicator, ParticipantName, TrackMutedIndicator,
    useMaybeParticipantContext,
    ParticipantContext,
    useEnsureParticipant,
    useMaybeLayoutContext,
    useParticipantTile,
    FocusToggle,
    usePinnedTracks,
    VideoTrack,
    // AudioTrack,
    TrackRefContext,
    useFeatureContext,
    useMaybeTrackRefContext,
    // AudioVisualizer,
    useEnsureTrackRef
} from '@livekit/components-react';
import { useIsEncrypted } from '@/livekit-react-offical/hooks/useIsEncrypted';
import FullIcon from './Icons/FullIcon';
import {AudioVisualizer} from "@/components/MyAudioVisualizer"
import {AudioTrack} from "@/components/MyAudioTrack"
import { VolumeMuteIndicator } from './VolumeMuteIndicator';

/**
 * The `ParticipantContextIfNeeded` component only creates a `ParticipantContext`
 * if there is no `ParticipantContext` already.
 * @example
 * ```tsx
 * <ParticipantContextIfNeeded participant={trackReference.participant}>
 *  ...
 * </ParticipantContextIfNeeded>
 * ```
 * @public
 */
export function ParticipantContextIfNeeded(
    props: React.PropsWithChildren<{
      participant?: Participant;
    }>,
  ) {
    const hasContext = !!useMaybeParticipantContext();
    return props.participant && !hasContext ? (
      <ParticipantContext.Provider value={props.participant}>
        {props.children}
      </ParticipantContext.Provider>
    ) : (
      <>{props.children}</>
    );
  }
  
  /**
   * Only create a `TrackRefContext` if there is no `TrackRefContext` already.
   * @internal
   */
  export function TrackRefContextIfNeeded(
    props: React.PropsWithChildren<{
      trackRef?: TrackReferenceOrPlaceholder;
    }>,
  ) {
    const hasContext = !!useMaybeTrackRefContext();
    return props.trackRef && !hasContext ? (
      <TrackRefContext.Provider value={props.trackRef}>{props.children}</TrackRefContext.Provider>
    ) : (
      <>{props.children}</>
    );
  }
  
  /** @public */
  export interface ParticipantTileProps extends React.HTMLAttributes<HTMLDivElement> {
    /** The track reference to display. */
    trackRef?: TrackReferenceOrPlaceholder;
    disableSpeakingIndicator?: boolean;
  
    onParticipantClick?: (event: ParticipantClickEvent) => void;
  }
  
  /**
   * The `ParticipantTile` component is the base utility wrapper for displaying a visual representation of a participant.
   * This component can be used as a child of the `TrackLoop` component or by passing a track reference as property.
   *
   * @example Using the `ParticipantTile` component with a track reference:
   * ```tsx
   * <ParticipantTile trackRef={trackRef} />
   * ```
   * @example Using the `ParticipantTile` component as a child of the `TrackLoop` component:
   * ```tsx
   * <TrackLoop>
   *  <ParticipantTile />
   * </TrackLoop>
   * ```
   * @public
   */
export const ParticipantTile: (
props: ParticipantTileProps & React.RefAttributes<HTMLDivElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLDivElement, ParticipantTileProps>(
function ParticipantTile(
    {
    trackRef,
    children,
    onParticipantClick,
    disableSpeakingIndicator,
    ...htmlProps
    }: ParticipantTileProps,
    ref,
) {
    const trackReference = useEnsureTrackRef(trackRef);
  
    const p = trackReference.participant
    const { elementProps } = useParticipantTile<HTMLDivElement>({
      htmlProps,
      disableSpeakingIndicator,
      onParticipantClick,
      trackRef: trackReference,
    });
    const isEncrypted = useIsEncrypted(trackReference.participant);
    const layoutContext = useMaybeLayoutContext();

    const autoManageSubscription = useFeatureContext()?.autoSubscription;

    const handleSubscribe = React.useCallback(
      (subscribed: boolean) => {
        if (
          trackReference.source &&
          !subscribed &&
          layoutContext &&
          layoutContext.pin.dispatch &&
          isTrackReferencePinned(trackReference, layoutContext.pin.state)
        ) {
          layoutContext.pin.dispatch({ msg: 'clear_pin' });
        }
      },
      [trackReference, layoutContext],
    );

  const curEl = React.useRef<HTMLDivElement>(null)

  const focusTrack = usePinnedTracks(layoutContext)?.[0];
  const [isAdmin, setIsAdmin] = React.useState(false)
  React.useEffect(()=>{
        if(p && p.metadata != undefined && p.metadata != ""){
            const met = JSON.parse(p.metadata as string)
            setIsAdmin(met.admin)
        }
  },[p])

  const fullscreen = React.useCallback(() => {
    // console.log("get!~")
    if (
        trackReference.source &&
        layoutContext &&
        layoutContext.pin.dispatch &&
        isTrackReferencePinned(trackReference, layoutContext.pin.state)){
        console.log("get!~")
        const t = curEl.current?.getElementsByTagName('video')
        if(!t) return
        for (let el of t) {
            el.requestFullscreen()
        }
    }
    }, [layoutContext, p, trackReference]);


  return (
    <div style={{ position: 'relative' }} {...elementProps}>
      <TrackRefContextIfNeeded trackRef={trackReference}>
        <ParticipantContextIfNeeded participant={trackReference.participant}>
          {children ?? (
            <div style={{display: 'contents'}} ref={curEl}>
              {isTrackReference(trackReference) &&
              (trackReference.publication?.kind === 'video' ||
                trackReference.source === Track.Source.Camera ||
                trackReference.source === Track.Source.ScreenShare) ? (
                <VideoTrack
                  trackRef={trackReference}
                  onSubscriptionStatusChanged={handleSubscribe}
                  manageSubscription={autoManageSubscription}
                />
              ) : (
                <>
                
                    <AudioVisualizer/>
                </>
              )}
              {/* 只有播放视频时才显示头像 */}
              {
                // isTrackReference(trackReference) &&
                (trackReference.publication?.kind === 'video' ||
                  trackReference.source === Track.Source.Camera ||
                  trackReference.source === Track.Source.ScreenShare) && (
                    <div className="lk-participant-placeholder">
                    <ParticipantPlaceholder />
                  </div>
                )
              }
              <div className="lk-participant-metadata">
                <div className="lk-participant-metadata-item">
                  {trackReference.source === Track.Source.Camera ||
                  trackReference.source === Track.Source.Microphone ? (
                    <>
                      {isEncrypted && <LockLockedIcon style={{ marginRight: '0.25rem' }} />}
                      <TrackMutedIndicator
                          trackRef={{
                            participant: trackReference.participant,
                            source: Track.Source.Microphone,
                          }}
                        show={'muted'}
                      ></TrackMutedIndicator>
                      <ParticipantName />
                    </>
                  ) : (
                    <>
                      <ScreenShareIcon style={{ marginRight: '0.25rem' }} />
                      <ParticipantName>&apos;s screen</ParticipantName>
                    </>
                  )}
                </div>
                {/* !p.isLocal && */}
                {
                    !p.isLocal &&  trackReference.source != Track.Source.ScreenShare
                    && trackReference.source != Track.Source.ScreenShareAudio &&
                    <VolumeMuteIndicator className="lk-participant-metadata-item hover:cursor-pointer opacity-0 volume-muter" />
                }
                <ConnectionQualityIndicator className="lk-participant-metadata-item" />
              </div>
            </div>
          )}
        {
          isAdmin && trackReference.source != Track.Source.ScreenShare
          && trackReference.source != Track.Source.ScreenShareAudio &&
          <div className=' absolute top-1 left-1 bg-black bg-opacity-50 rounded-sm px-1' >Admin</div>
        }
        <FocusToggle trackRef={trackReference} />
        {
           focusTrack &&  trackReference.source !== Track.Source.Camera && <FullIcon onClick={fullscreen} className='volume-muter absolute top-1 left-1 cursor-pointer bg-black/50 rounded-sm ' />
        }
        </ParticipantContextIfNeeded>
      </TrackRefContextIfNeeded>
    </div>
  );
}
);
