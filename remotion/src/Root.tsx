import React from 'react';
import {Composition} from 'remotion';
import {Ep03, TOTAL as T03, FPS} from './episodes/Ep03_Taaruf';
// Register each new episode here: import {EpNN, TOTAL as TNN} from './episodes/EpNN_<slug>';
export const Root: React.FC = () => (<>
  <Composition id="ep03" component={Ep03} durationInFrames={Math.round(T03 * FPS)} fps={FPS} width={1080} height={1920} />
</>);
