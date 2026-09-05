"use client";

import { useEffect, useRef } from "react";

// The poster is painted as a plain CSS background on the wrapper rather than
// as an <img>/next-image. That way the hero always shows something — even if
// the video is blocked by an autoplay policy, hidden by Reduce Motion, fails
// to decode, or never loads at all. The video layers on top and takes over
// once it can play. Filenames carry their own version (…-v6.…) so replacing
// the footage busts every browser/CDN cache without query strings, which some
// browsers and image pipelines handle inconsistently.
const POSTER = "/images/hero-truck-poster-v6.jpg";

export default function HeroVideo() {
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
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${POSTER}')` }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={POSTER}
        className="absolute inset-0 h-full w-full object-cover object-center motion-reduce:hidden"
      >
        {/* mp4 first: it's the only format WebKit plays, and it's the smaller file. */}
        <source src="/videos/hero-truck-v6.mp4" type="video/mp4" />
        <source src="/videos/hero-truck-v6.webm" type="video/webm" />
      </video>
    </div>
  );
}
