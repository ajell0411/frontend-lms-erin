"use client";

import { createContext, useContext } from "react";

export type ViewMode = { readOnly: boolean; basePath: string };

export const ReadOnlyContext = createContext<ViewMode>({ readOnly: false, basePath: "/admin" });
export const ViewModeProvider = ReadOnlyContext.Provider;

export function useViewMode(): ViewMode {
  return useContext(ReadOnlyContext);
}