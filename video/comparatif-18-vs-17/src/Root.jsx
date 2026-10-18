import {Composition} from 'remotion';
import {Video, DURATION} from './Video';
// 66 s à 60 i/s ; rendu 4K avec --scale=2
export const Root = () => (
  <>
    <Composition id="ComparatifVertical" component={Video} durationInFrames={DURATION * 60} fps={60} width={1080} height={1920} defaultProps={{vertical: true}} />
    <Composition id="Comparatif" component={Video} durationInFrames={DURATION * 60} fps={60} width={1920} height={1080} defaultProps={{vertical: false}} />
  </>
);
