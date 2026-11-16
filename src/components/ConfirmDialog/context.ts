import { createContext } from 'react';
import { ConfirmFn } from './types';

export const ConfirmContext = createContext<ConfirmFn | null>(null);
