"use client";

import { useEffect, useRef } from "react";

// A background video that degrades to a still frame instead of to nothing.
//
// The poster is painted as a plain CSS background on the wrapper rather than
// as an <img>/next-image, so the block always shows artwork — even if the
// video is blocked by an autoplay policy, fails to decode, or never loads.
// The video layers on top and takes over once it can play. Asset filenames
// carry their own version (…-v6.…) so replacing the footage busts every
// browser/CDN cache without query strings, which some browsers and image
// pipelines handle inconsistently.
//
// Note: the video deliberately does NOT opt out under prefers-reduced-motion.
// A motion-reduce:hidden rule used to sit on it, which meant anyone browsing
// with iOS Reduce Motion enabled saw only the frozen poster — the footage is
// a slow, steady drive rather than the parallax/zoom effects that setting is
// meant to suppress, and it's the whole point of the hero.
export default function AutoplayVideo({
  mp4,
  webm,
  poster,
  alt,
  className = "",
  videoClassName = "",
}: {
  mp4: string;
  webm?: string;
  poster: string;
  alt?: string;
  className?: string;
  videoClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let playing = false;

    // Never call load() up front: it resets the element and aborts any
    // autoplay the browser already started, leaving the poster frozen on
    // screen. It's only useful as a last-resort recovery below, when
    // nothing has loaded at all.
    const tryPlay = () => {
      if (playing) return;
      const attempt = video.play();
      if (attempt) attempt.then(teardown).catch(() => {});
    };

    // Retries stay registered until playback actually succeeds. An earlier
    // version used { once: true }, so a scroll fired on load, play() was
    // rejected, and the listener deleted itself — every later tap was dead.
    const events: Array<keyof DocumentEventMap> = ["touchstart", "pointerdown", "click", "keydown", "scroll"];
    const mediaEvents = ["loadeddata", "canplay", "canplaythrough"];

    function teardown() {
      playing = true;
      events.forEach((event) => document.removeEventListener(event, tryPlay));
      mediaEvents.forEach((event) => video!.removeEventListener(event, tryPlay));
    }

    events.forEach((event) => document.addEventListener(event, tryPlay, { passive: true }));
    mediaEvents.forEach((event) => video.addEventListener(event, tryPlay));

    // iOS won't start a video that's scrolled out of view, which is the
    // normal case for the cards further down the city and recruiting pages.
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && tryPlay()),
      { threshold: 0.1 },
    );
    observer.observe(video);

    tryPlay();

    // If the source genuinely never loaded (readyState 0), re-read it once.
    const recover = window.setTimeout(() => {
      if (!playing && video.readyState === 0) {
        video.load();
        tryPlay();
      }
    }, 3000);

    return () => {
      window.clearTimeout(recover);
      observer.disconnect();
      teardown();
    };
  }, []);

  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt}
      className={`bg-cover bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url('${poster}')` }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        className={videoClassName}
      >
        {/* mp4 first: it's the only format WebKit plays, and it's the smaller file. */}
        <source src={mp4} type="video/mp4" />
        {webm && <source src={webm} type="video/webm" />}
      </video>
    </div>
  );
}
