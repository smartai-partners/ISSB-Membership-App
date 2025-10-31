/**
 * Typed Redux Hooks
 * Pre-typed versions of useDispatch and useSelector for TypeScript
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

/**
 * Use throughout your app instead of plain `useDispatch`
 * Provides correct typing for dispatch actions
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Use throughout your app instead of plain `useSelector`
 * Provides correct typing for state selection
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
