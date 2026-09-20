/**
 * useVideoScrub.ts — Scroll-Driven Video Playback Runtime
 *
 * Controls video playback position based on scroll progress:
 *   - Maps scroll progress to video currentTime
 *   - Supports paused + scrub mode
 *   - Proper video element lifecycle
 *   - Reduced motion: shows poster or first frame
 */

'use client';

import { useEffect, useRef } from 'react';
import { createResourceTracker } from './ResourceTracker';

export interface VideoScrubConfig {
  videoUrl: string;
  posterUrl?: string;
  loop?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill';
  opacity?: number;
}

export interface UseVideoScrubOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: VideoScrubConfig;
  scrollProgress?: number;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function useVideoScrub({
  containerRef,
  config,
  scrollProgress = 0,
  isPlaying = true,
  reducedMotion = false,
}: UseVideoScrubOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<ReturnType<typeof createResourceTracker> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !config?.videoUrl || reducedMotion) return;

    const tracker = createResourceTracker('video-scrub');
    trackerRef.current = tracker;

    const video = document.createElement('video');
    video.src = config.videoUrl;
    if (config.posterUrl) video.poster = config.posterUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    if (config.objectFit) video.style.objectFit = config.objectFit;
    if (config.opacity !== undefined) video.style.opacity = String(config.opacity);

    container.insertBefore(video, container.firstChild);
    videoRef.current = video;

    tracker.track('video-element', () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    });

    return () => {
      tracker.disposeAll();
      videoRef.current = null;
    };
  }, [containerRef, config?.videoUrl, config?.posterUrl, config?.objectFit, config?.opacity, reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;

    if (config?.loop) {
      video.loop = true;
      if (isPlaying) video.play().catch(() => {});
    } else if (video.duration && isFinite(video.duration)) {
      video.currentTime = scrollProgress * video.duration;
      video.pause();
    }
  }, [scrollProgress, isPlaying, config?.loop, reducedMotion]);

  return { videoRef };
}
