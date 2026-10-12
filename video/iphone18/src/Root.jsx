import {Composition} from 'remotion';
import {Video} from './Video';
// 48,5 s à 60 i/s ; rendu 4K avec --scale=2
export const Root = () => (
  <>
    <Composition id="IPhone18" component={Video} durationInFrames={2910} fps={60} width={1920} height={1080} defaultProps={{vertical: false}} />
    <Composition id="IPhone18Vertical" component={Video} durationInFrames={2910} fps={60} width={1080} height={1920} defaultProps={{vertical: true}} />
    {/* pour invideo : écran de fin sans textes */}
    <Composition id="IPhone18SansTexteFin" component={Video} durationInFrames={2910} fps={60} width={1920} height={1080} defaultProps={{vertical: false, texteFin: false}} />
    <Composition id="IPhone18VerticalSansTexteFin" component={Video} durationInFrames={2910} fps={60} width={1080} height={1920} defaultProps={{vertical: true, texteFin: false}} />
  </>
);
