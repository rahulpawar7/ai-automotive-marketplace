import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './index';

/** Typed `useDispatch` — always returns our project's `AppDispatch`. */
export const useAppDispatch: () => AppDispatch = useDispatch;

/** Typed `useSelector` — selector receives the project's `RootState`. */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
