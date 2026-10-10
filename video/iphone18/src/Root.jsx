import {Composition} from 'remotion';
import {Video} from './Video';
// 48,5 s à 60 i/s ; rendu 4K avec --scale=2
export const Root = () => (
  <>
    <Composition id="IPhone18" component={Video} durationInFrames={2910} fps={60} width={1920} height={1080} defaultProps={{vertical: false}} />
    <Composition id="IPhone18Vertical" component={Video} durationInFrames={2910} fps={60} width={1080} height={1920} defaultProps={{vertical: true}} />
  </>
);
