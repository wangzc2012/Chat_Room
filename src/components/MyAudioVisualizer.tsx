import { type TrackReference } from '@livekit/components-core';
import * as React from 'react';
import { useEnsureTrackRef } from '@livekit/components-react';
import { useMultibandTrackVolume } from '@/livekit-react-offical/hooks/useTrackVolume'
import { useObservableState } from '@/livekit-react-offical/hooks/internal';
import { denoiseMethod$ } from '@/lib/observe/DenoiseMethodObs';
import { defaultAudioSetting } from '@/lib/const';
import { useMainBrowser } from "@/lib/hooks/useMainBrowser";
import { DenoiseMethod } from '@/lib/types';
import { useDenoiseMethod } from '@/lib/hooks/useDenoise';
/**
 * @public
 * @deprecated Use BarVisualizer instead
 */
export interface AudioVisualizerProps extends React.HTMLAttributes<SVGElement> {
  trackRef?: TrackReference;
}

/**
 * The AudioVisualizer component is used to visualize the audio volume of a given audio track.
 * @remarks
 * Requires a `TrackReferenceOrPlaceholder` to be provided either as a property or via the `TrackRefContext`.
 * @example
 * ```tsx
 * <AudioVisualizer />
 * ```
 * @public
 * @deprecated Use BarVisualizer instead
 */
export const AudioVisualizer: (
  props: AudioVisualizerProps & React.RefAttributes<SVGSVGElement>,
) => React.ReactNode = /* @__PURE__ */ React.forwardRef<SVGSVGElement, AudioVisualizerProps>(
  function AudioVisualizer({ trackRef, ...props }: AudioVisualizerProps, ref) {
    const svgWidth = 200;
    const svgHeight = 90;
    const barWidth = 6;
    const barSpacing = 4;
    const volMultiplier = 50;
    const barCount = 7;
    const trackReference = useEnsureTrackRef(trackRef);
    // add cwy 查看当前选择的降噪方法是否为join
    const denoiseMethod = useDenoiseMethod()
    const isMainBrowser  = useMainBrowser()
    let m: DenoiseMethod;
    if(isMainBrowser){
        m = denoiseMethod
    }

    const volumes = useMultibandTrackVolume(trackReference, { bands: 7, loPass: 300 }, denoiseMethod);

    return (
      <svg
        ref={ref}
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      {...props}
      className="lk-audio-visualizer"
    >
      <rect x="0" y="0" width="100%" height="100%" />
      <g
        style={{
          transform: `translate(${(svgWidth - barCount * (barWidth + barSpacing)) / 2}px, 0)`,
        }}
      >
          {volumes.map((vol, idx) => (
            <rect
              key={idx}
              x={idx * (barWidth + barSpacing)}
              y={svgHeight / 2 - (vol * volMultiplier) / 2}
              width={barWidth}
              height={vol * volMultiplier}
            ></rect>
          ))}
        </g>
      </svg>
    );
  },
);
