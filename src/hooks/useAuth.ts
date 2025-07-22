import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "../app/store.js";

// Typed version of useDispatch to include custom AppDispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// Typed version of useSelector to infer state structure from RootState
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
