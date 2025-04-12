import { getTrackReferenceId, isLocal } from '@livekit/components-core';
import { Track } from 'livekit-client';
import * as React from 'react';
import { useTracks } from '@livekit/components-react';
import { volumes$ } from '@/lib/observe/volumeObs';
import { useObservableState } from '@/livekit-react-offical/hooks/internal';
import {AudioTrack} from '@/components/MyAudioTrack'
/** @public */
export interface RoomAudioRendererProps {
    /** Sets the volume for all audio tracks rendered by this component. By default, the range is between `0.0` and `1.0`. */
    volume?: number;
    /**
     * If set to `true`, mutes all audio tracks rendered by the component.
     * @remarks
     * If set to `true`, the server will stop sending audio track data to the client.
     * @alpha
     */
    muted?: boolean;
  }
  
  /**
   * The `RoomAudioRenderer` component is a drop-in solution for adding audio to your LiveKit app.
   * It takes care of handling remote participants’ audio tracks and makes sure that microphones and screen share are audible.
   *
   * @example
   * ```tsx
   * <LiveKitRoom>
   *   <RoomAudioRenderer />
   * </LiveKitRoom>
   * ```
   * @public
   */
export const RoomAudioRenderer = ({ volume, muted }: RoomAudioRendererProps) => {
    const tracks = useTracks(
        [Track.Source.Microphone, Track.Source.ScreenShareAudio, Track.Source.Unknown],
        {
          updateOnlyOn: [],
          onlySubscribed: true,
        },
      ).filter((ref) => !ref.participant.isLocal && ref.publication.kind === Track.Kind.Audio);

// 订阅volumes改变音量
const volumeState = useObservableState(volumes$, {
    volume:1,
    participantId:""
});

const [volumesMap, setVolumeMap] = React.useState(new Map<string, number>())

React.useEffect(() => {
    volumesMap.set(volumeState.participantId, volumeState.volume)
    setVolumeMap(new Map<string, number>(volumesMap))
}, [volumeState])

  return (
    <div style={{ display: 'none' }}>
      {tracks.map((trackRef) => 
      {
        const v = volumesMap.get(trackRef.participant.identity)
        // console.log(`set volume ${v} for ${trackRef.participant.identity}`)
        return (
            v != 0 &&
            <AudioTrack hidden key={getTrackReferenceId(trackRef)} trackRef={trackRef} muted={muted} volume={volumesMap.get(trackRef.participant.identity)} />
          )
      })}
    </div>
  );
};