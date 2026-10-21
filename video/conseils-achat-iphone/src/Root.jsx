import {Composition} from 'remotion';
import {Video, VIDEO_DURATION} from './Video';
// v5 : durée calée sur la voix French Darling, 60 i/s ; rendu 4K avec --scale=2
export const Root = () => (
  <>
    <Composition id="ConseilsVertical" component={Video} durationInFrames={Math.round(VIDEO_DURATION * 60)} fps={60} width={1080} height={1920} defaultProps={{vertical: true}} />
    <Composition id="Conseils" component={Video} durationInFrames={Math.round(VIDEO_DURATION * 60)} fps={60} width={1920} height={1080} defaultProps={{vertical: false}} />
  </>
);
