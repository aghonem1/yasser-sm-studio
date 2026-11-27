import React from 'react';
import {Quiz, quizLength, FPS} from './Quiz';
import spec from '../../../quiz/q01.json';
export const TOTAL = quizLength(spec);
export {FPS};
export const Q01: React.FC = () => <Quiz spec={spec} />;
