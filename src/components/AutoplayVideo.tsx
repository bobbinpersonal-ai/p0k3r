"use client";

import { useEffect, useRef } from "react";

// A background video that degrades to a still frame instead of to nothing.
//
// The poster is painted as a plain CSS background on the wrapper rather than
// as an <img>/next-image, so the block always shows artwork — even if the
// video is blocked by an autoplay policy, hidden by Reduce Motion, fails to
// decode, or never loads. The video layers on top and takes over once it can
// play. Asset filenames carry their own version (…-v6.…) so replacing the
// footage busts every browser/CDN cache without query strings, which some
// browsers and image pipelines handle inconsistently.
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

    // Safari/WebKit (so Brave on iOS too) can fail to pick up <source>
    // children after React hydrates the page around them; load() re-reads them.
    video.load();

    const tryPlay = () => {
      video.play().catch(() => {});
    };
    tryPlay();

    // Autoplay policies (Brave Shields, iOS Low Power Mode) block muted
    // autoplay but exempt play() from a real user gesture, so retry on one.
    const events: Array<keyof DocumentEventMap> = ["touchstart", "pointerdown", "keydown", "scroll"];
    events.forEach((event) => document.addEventListener(event, tryPlay, { once: true, passive: true }));
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    return () => {
      events.forEach((event) => document.removeEventListener(event, tryPlay));
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
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
