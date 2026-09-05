"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// A muted+playsInline <video autoPlay> should self-start in every modern
// browser, but some autoplay policies (Brave's Shields, iOS Low Power Mode)
// silently block it anyway and just sit on the poster frame. Those policies
// all exempt play() calls made from a real user gesture, so retry once on
// the first touch/click/keypress/scroll to recover from that case.
export default function HeroVideo({ version }: { version: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.play().catch(() => {});
    };
    tryPlay();

    const events: Array<keyof DocumentEventMap> = ["touchstart", "pointerdown", "keydown", "scroll"];
    events.forEach((event) => document.addEventListener(event, tryPlay, { once: true, passive: true }));
    return () => {
      events.forEach((event) => document.removeEventListener(event, tryPlay));
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={`/images/hero-truck-poster.jpg?v=${version}`}
        className="absolute inset-0 h-full w-full object-cover object-center motion-reduce:hidden"
      >
        <source src={`/videos/hero-truck.webm?v=${version}`} type="video/webm" />
        <source src={`/videos/hero-truck.mp4?v=${version}`} type="video/mp4" />
      </video>
      <Image
        src={`/images/hero-truck-poster.jpg?v=${version}`}
        alt="A LoveMeAfter moving truck on the road"
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-center motion-reduce:block"
      />
    </>
  );
}
