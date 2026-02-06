import { useEffect } from "react";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";

export function useNavigationBlocker(shouldBlock, message = "Are you sure you want to leave?") {
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (shouldBlock()) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // In-app navigation blocking (optional workaround)
  useEffect(() => {
    const unblock = navigate.block?.((tx) => {
      if (shouldBlock()) {
        const confirmLeave = window.confirm(message);
        if (confirmLeave) {
          tx.retry();
        }
      } else {
        tx.retry();
      }
    });

    return () => unblock && unblock();
  }, [navigate, location, shouldBlock, message]);
}
