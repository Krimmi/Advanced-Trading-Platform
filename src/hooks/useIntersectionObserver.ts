import { useState, useEffect, useRef, RefObject } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

/**
 * Custom hook for tracking element visibility using Intersection Observer API
 * @param options - Intersection Observer options
 * @returns [ref, isIntersecting] - A ref to attach to the target element and a boolean indicating if it's visible
 */
function useIntersectionObserver<T extends Element = HTMLDivElement>({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  once = false,
}: IntersectionObserverOptions = {}): [RefObject<T>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Skip if we've already triggered once and once option is true
    if (once && hasTriggeredRef.current) {
      return;
    }

    const target = targetRef.current;
    if (!target) return;

    // Cleanup previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observerCallback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      const newIsIntersecting = entry.isIntersecting;
      
      setIsIntersecting(newIsIntersecting);
      
      // If element is intersecting and we only want to trigger once
      if (newIsIntersecting && once) {
        hasTriggeredRef.current = true;
        // Disconnect the observer if we only need to detect once
        observerRef.current?.disconnect();
      }
    };

    // Create new observer
    const observer = new IntersectionObserver(observerCallback, {
      root,
      rootMargin,
      threshold,
    });

    observer.observe(target);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, once]);

  return [targetRef, isIntersecting];
}

export default useIntersectionObserver;