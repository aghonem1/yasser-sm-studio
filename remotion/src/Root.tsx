import React from 'react';
import {Composition} from 'remotion';
import {Ep03, TOTAL as T03, FPS} from './episodes/Ep03_Taaruf';
import {Ep04, TOTAL as T04} from './episodes/Ep04_Balagh';
import {Ep05, TOTAL as T05} from './episodes/Ep05_Ikrah';
import {Ep06, TOTAL as T06} from './episodes/Ep06_Birr';
import {Web01V, TOTAL_V} from './episodes/Webinar01_Collage';
import {CollageFrames} from './episodes/Webinar01_CollageFrames';
import {Web01, Web01S, TOTAL_FULL, TOTAL_SHORT} from './episodes/Webinar01_Khadijah';
// Register each new episode here: import {EpNN, TOTAL as TNN} from './episodes/EpNN_<slug>';
export const Root: React.FC = () => (<>
  <Composition id="ep03" component={Ep03} durationInFrames={Math.round(T03 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep04" component={Ep04} durationInFrames={Math.round(T04 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep05" component={Ep05} durationInFrames={Math.round(T05 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep06" component={Ep06} durationInFrames={Math.round(T06 * FPS)} fps={FPS} width={1080} height={1920} />
  {/* webinar teaser: full 16:9 explainer and the 9:16 short cut */}
  <Composition id="web01" component={Web01} durationInFrames={Math.round(TOTAL_FULL * FPS)} fps={FPS} width={1920} height={1080} />
  <Composition id="web01s" component={Web01S} durationInFrames={Math.round(TOTAL_SHORT * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="collage" component={CollageFrames} durationInFrames={4} fps={FPS} width={1920} height={1080} />
  <Composition id="web01v" component={Web01V} durationInFrames={Math.round(TOTAL_V * FPS)} fps={FPS} width={1920} height={1080} />
</>);
