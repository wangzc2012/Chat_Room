import type { Participant, Track, TrackPublication } from 'livekit-client';
import * as React from 'react';
import type { TrackReference } from '@livekit/components-core';
import { log } from '@livekit/components-core';
import { useEnsureParticipant, useEnsureTrackRef, useMaybeTrackRefContext } from '@livekit/components-react';
import { RemoteAudioTrack, RemoteTrackPublication } from 'livekit-client';

import { useMediaTrackBySourceOrName } from '@/livekit-react-offical/hooks/useMediaTrackBySourceOrName';
import { useWebAudioContext } from '@/lib/context/webAudioContex';
import { defaultAudioSetting, rnnoiseWasmPath, rnnoiseWasmSimdPath, speexWasmPath } from '@/lib/const';
import { SpeexWorkletNode, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import { useMainBrowser } from "@/lib/hooks/useMainBrowser";
import { useDenoiseMethod } from '@/lib/hooks/useDenoise';

/** @public */
export interface AudioTrackProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
    /** The track reference of the track from which the audio is to be rendered. */
    trackRef?: TrackReference;
  
    onSubscriptionStatusChanged?: (subscribed: boolean) => void;
    /** Sets the volume of the audio track. By default, the range is between `0.0` and `1.0`. */
    volume?: number;
    /**
     * Mutes the audio track if set to `true`.
     * @remarks
     * If set to `true`, the server will stop sending audio track data to the client.
     * @alpha
     */
    muted?: boolean;
  }

/**
 * The AudioTrack component is responsible for rendering participant audio tracks.
 * This component must have access to the participant's context, or alternatively pass it a `Participant` as a property.
 *
 * @example
 * ```tsx
 *   <ParticipantTile>
 *     <AudioTrack trackRef={trackRef} />
 *   </ParticipantTile>
 * ```
 *
 * @see `ParticipantTile` component
 * @public
 */
export const AudioTrack: (
    props: AudioTrackProps & React.RefAttributes<HTMLAudioElement>,
  ) => React.ReactNode = /* @__PURE__ */ React.forwardRef<HTMLAudioElement, AudioTrackProps>(
    function AudioTrack(
      { trackRef, onSubscriptionStatusChanged, volume, ...props }: AudioTrackProps,
      ref,
    ) {
      const trackReference = useEnsureTrackRef(trackRef);

    // add cwy 查看当前选择的降噪方法是否为join
    const ctx = useWebAudioContext()
    const [speex, setSpeex] = React.useState<SpeexWorkletNode>()
    const [rnn, setRNN] = React.useState<RnnoiseWorkletNode>()      
    const denoiseMethod = useDenoiseMethod()
    const isMainBrowser  = useMainBrowser()

      const mediaEl = React.useRef<HTMLAudioElement>(null);
      React.useImperativeHandle(ref, () => mediaEl.current as HTMLAudioElement);
  
      const {
        elementProps,
        isSubscribed,
        track,
        publication: pub,
      } = useMediaTrackBySourceOrName(trackReference, {
        element: mediaEl,
        props,
      });
  
      React.useEffect(() => {
        onSubscriptionStatusChanged?.(!!isSubscribed);
      }, [isSubscribed, onSubscriptionStatusChanged]);
  
      React.useEffect(() => {
        if (track === undefined || volume === undefined) {
          return;
        }
        if (track instanceof RemoteAudioTrack) {
          track.setVolume(volume);
        } else {
          log.warn('Volume can only be set on remote audio tracks.');
        }
      }, [volume, track]);

      React.useEffect(() => {
        if (pub === undefined || props.muted === undefined) {
          return;
        }
        if (pub instanceof RemoteTrackPublication) {
          pub.setEnabled(!props.muted);
        } else {
          log.warn('Can only call setEnabled on remote track publications.');
        }
      }, [props.muted, pub, track]);

  React.useEffect(() => {
    if(!isMainBrowser || !track || !(track instanceof RemoteAudioTrack)) return
    
    const mdenoiseTools = require('@sapphi-red/web-noise-suppressor')

    try{
        // 清除之前的降噪模块
        if (speex) {
            speex.destroy()
            speex.disconnect()
        }
        if (rnn) {
            rnn.destroy()
            rnn.disconnect()
        }
        track.setWebAudioPlugins([])
        
        // 添加降噪模块
        if (denoiseMethod.speex) {
            
            mdenoiseTools.loadSpeex({ url: speexWasmPath }).then((speexWasmBinary: any) => {
                
                const speexn = new mdenoiseTools.SpeexWorkletNode(ctx, {
                    wasmBinary: speexWasmBinary,
                    maxChannels: 2
                })
                setSpeex(speexn)
    
    
                if(speexn && track instanceof RemoteAudioTrack){
                    track.setWebAudioPlugins([
                        speexn
                    ])
                }
            })
        }else if(denoiseMethod.rnn){

            mdenoiseTools.loadRnnoise({    
                url: rnnoiseWasmPath,
                simdUrl: rnnoiseWasmSimdPath
              }).then((RNNWasmBinary: any) => {
        
                
                const mrnnoise =  new mdenoiseTools.RnnoiseWorkletNode(ctx, {
                    wasmBinary: RNNWasmBinary,
                    maxChannels: 2
                  })
                  setRNN(mrnnoise)

                  if(mrnnoise && track instanceof RemoteAudioTrack){
                    track.setWebAudioPlugins([
                        mrnnoise
                    ])
                }
            })
        }
    }catch(e){
        console.log(e)
    }
    return ()=>{
        speex?.disconnect()
        rnn?.disconnect()
    }
}, [denoiseMethod, track,  isMainBrowser])

    return <audio ref={mediaEl} {...elementProps} />;
    },
);
