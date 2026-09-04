import { createContext, useContext, useState } from "react";
import { placeholderData } from "../data.js";

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [appData, setAppData] = useState(() => structuredClone(placeholderData));
  return <AppDataContext.Provider value={{ appData, setAppData }}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider");
  return context;
}