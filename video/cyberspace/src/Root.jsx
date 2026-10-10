import {Composition} from 'remotion';
import {Video} from './Video';
export const Root = () => (
  <>
    <Composition id="CyberSpace" component={Video} durationInFrames={3030} fps={60} width={1920} height={1080} defaultProps={{vertical: false}} />
    <Composition id="CyberSpaceVertical" component={Video} durationInFrames={3030} fps={60} width={1080} height={1920} defaultProps={{vertical: true}} />
  </>
);
