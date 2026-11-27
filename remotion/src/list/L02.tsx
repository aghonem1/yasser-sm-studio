import React from 'react';
import {List, listLength, FPS} from './List';
import spec from '../../../list/l02.json';
export const TOTAL = listLength(spec);
export {FPS};
export const L02: React.FC = () => <List spec={spec} />;
