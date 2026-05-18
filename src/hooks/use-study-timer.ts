import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { logStudySession } from "@/lib/study.functions";

type Activity = "summary" | "flashcards" | "quiz" | "chat" | "upload";

/**
 * Tracks active time on a study tab and logs a study_sessions row
 * on unmount (or when the tab is hidden long enough). Only counts
 * time while the document is visible.
 */
export function useStudyTimer(
  activity: Activity,
  documentId: string | null,
  enabled: boolean = true,
) {
  const log = useServerFn(logStudySession);

  const startRef = useRef<number>(Date.now());
  const accumMsRef = useRef<number>(0);
  const activeRef = useRef<boolean>(true);

  useEffect(() => {
    if (!enabled) return;

    startRef.current = Date.now();
    accumMsRef.current = 0;
    activeRef.current = true;

    const pause = () => {
      if (activeRef.current) {
        accumMsRef.current += Date.now() - startRef.current;
        activeRef.current = false;
      }
    };
    const resume = () => {
      if (!activeRef.current) {
        startRef.current = Date.now();
        activeRef.current = true;
      }
    };
    const onVisibility = () => (document.hidden ? pause() : resume());

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pause();
      const seconds = Math.round(accumMsRef.current / 1000);
      if (seconds >= 5) {
        log({
          data: { activity, documentId, durationSeconds: seconds },
        }).catch(() => {
          /* swallow — non-critical telemetry */
        });
      }
    };
  }, [activity, documentId, enabled, log]);
}
