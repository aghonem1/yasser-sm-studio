import React from 'react';
import {Composition} from 'remotion';
import {Ep03, TOTAL as T03, FPS} from './episodes/Ep03_Taaruf';
import {Ep04, TOTAL as T04} from './episodes/Ep04_Balagh';
import {Ep05, TOTAL as T05} from './episodes/Ep05_Ikrah';
import {Ep06, TOTAL as T06} from './episodes/Ep06_Birr';
import {Ep07, TOTAL as T07} from './episodes/Ep07_Ghuluw';
import {Ep08, TOTAL as T08} from './episodes/Ep08_Ahsan';
import {Ep09, TOTAL as T09} from './episodes/Ep09_Qist';
import {Web01R, TOTAL_R} from './episodes/Webinar01_Reel';
import {Web01R1, TOTAL_R as TOTAL_R1} from './episodes/Webinar01_Story_R1';
import {Web01R2, TOTAL_R as TOTAL_R2} from './episodes/Webinar01_Story_R2';
import {Web01R3, TOTAL_R as TOTAL_R3} from './episodes/Webinar01_Story_R3';
import {Web01R4, TOTAL_R as TOTAL_R4} from './episodes/Webinar01_Story_R4';
import {Web01V, TOTAL_V} from './episodes/Webinar01_Collage';
import {CollageFrames} from './episodes/Webinar01_CollageFrames';
import {Web01, Web01S, TOTAL_FULL, TOTAL_SHORT} from './episodes/Webinar01_Khadijah';
import {B01, TOTAL as TB01} from './trackb/B01_AllahuAkbar';
import {B02, TOTAL as TB02} from './trackb/B02_Bismillah';
// Track B episodes: import {BNN, TOTAL as TBNN} from './trackb/BNN_<slug>';
// Register each new episode here: import {EpNN, TOTAL as TNN} from './episodes/EpNN_<slug>';
export const Root: React.FC = () => (<>
  <Composition id="ep03" component={Ep03} durationInFrames={Math.round(T03 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep04" component={Ep04} durationInFrames={Math.round(T04 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep05" component={Ep05} durationInFrames={Math.round(T05 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep06" component={Ep06} durationInFrames={Math.round(T06 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep07" component={Ep07} durationInFrames={Math.round(T07 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep08" component={Ep08} durationInFrames={Math.round(T08 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="ep09" component={Ep09} durationInFrames={Math.round(T09 * FPS)} fps={FPS} width={1080} height={1920} />
  {/* Track B ("a phrase you say every day", light stick-figure style) */}
  <Composition id="b01" component={B01} durationInFrames={Math.round(TB01 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="b02" component={B02} durationInFrames={Math.round(TB02 * FPS)} fps={FPS} width={1080} height={1920} />
  {/* webinar teaser: full 16:9 explainer and the 9:16 short cut */}
  <Composition id="web01" component={Web01} durationInFrames={Math.round(TOTAL_FULL * FPS)} fps={FPS} width={1920} height={1080} />
  <Composition id="web01s" component={Web01S} durationInFrames={Math.round(TOTAL_SHORT * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="collage" component={CollageFrames} durationInFrames={4} fps={FPS} width={1920} height={1080} />
  <Composition id="web01r" component={Web01R} durationInFrames={Math.round(TOTAL_R * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="web01r1" component={Web01R1} durationInFrames={Math.round(TOTAL_R1 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="web01r2" component={Web01R2} durationInFrames={Math.round(TOTAL_R2 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="web01r3" component={Web01R3} durationInFrames={Math.round(TOTAL_R3 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="web01r4" component={Web01R4} durationInFrames={Math.round(TOTAL_R4 * FPS)} fps={FPS} width={1080} height={1920} />
  <Composition id="web01v" component={Web01V} durationInFrames={Math.round(TOTAL_V * FPS)} fps={FPS} width={1920} height={1080} />
</>);
