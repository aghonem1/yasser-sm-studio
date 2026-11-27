import React from 'react';
import {List, listLength, FPS} from './List';
import spec from '../../../list/l01.json';
export const TOTAL = listLength(spec);
export {FPS};
export const L01: React.FC = () => <List spec={spec} />;
