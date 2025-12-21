import React, { createContext, useState, useContext, useEffect, ReactNode, Children } from "react";
import { useSubmissionWindow } from "../features/camera/hooks/useSubmissionWindow";
import { getUserStatus } from "../features/camera/api";

interface SnapshotContextType {
  hasPosted: boolean;
  markAsPosted: () => void;
  refreshStatus: () => Promise<void>;
}

const SnapshotContext = createContext<SnapshotContextType | undefined>(undefined);

export const SnapshotProvider = ({ children }: { children: ReactNode }) => {
  const [hasPosted, setHasPosted] = useState<boolean>(false);
  const { isWindowOpen } = useSubmissionWindow();

  const refreshStatus = async () => {
    if (isWindowOpen) {
      try {
        const posted = await getUserStatus();
        setHasPosted(posted);
      } catch (e) {
        console.error("Failed to fetch status", e);
      }
    } else {
      setHasPosted(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [isWindowOpen]);

  const markAsPosted = () => setHasPosted(true);

  return (
    <SnapshotContext.Provider value={{ hasPosted, markAsPosted, refreshStatus }}>
      {children}
    </SnapshotContext.Provider>
  );
};

export const useSnapshot = () => {
  const context = useContext(SnapshotContext);
  if (!context) throw new Error("useSnapshot must be used within a SnapshotProvider");
  return context;
};