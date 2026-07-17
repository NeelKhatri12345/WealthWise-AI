import { useEffect } from "react";
import { appConfig } from "@/config/app.config";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${appConfig.name}` : appConfig.name;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
