
import { BehaviorSubject, Subject, scan, map, takeUntil } from 'rxjs';
import {DenoiseMethod } from '../types';
import { defaultAudioSetting } from '../const';


export const denoiseMethod$ = new BehaviorSubject<DenoiseMethod>(defaultAudioSetting.denoiseMethod);
