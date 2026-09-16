import AutoplayVideo from "@/components/AutoplayVideo";

// The hero footage, pinned while the page scrolls over it.
//
// A normal background video leaves the screen the moment somebody scrolls,
// which on a phone is about one second. This one sticks to the top of the
// viewport for the height of whatever is wrapped in it, so the copy and the
// form travel up over the footage and the footage stays on screen — you get
// two or three screens of scrolling with the crew still working behind it.
//
// The mechanics: the video sits in a `sticky top-0` block a full viewport
// tall, and the content is pulled back up over it with a negative margin of
// the same height. The sticky block releases when the wrapper's bottom
// reaches it, which is what ends the effect.
//
// The margin has to be written as an arbitrary value. Tailwind puts `svh` on
// the height scale but not the spacing scale, so `-mt-svh` compiles to
// nothing at all — the pull-up silently does not happen and the whole page
// drops a screen, which is exactly the bug this shipped with first time.
//
// Deliberately not negative z-index. A `-z-10` child paints behind its own
// parent's background, which is fine until somebody gives a section a
// background and the video silently disappears. Explicit z-0 and z-10 do the
// same job without the trap.

export default function StickyHeroVideo({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative">
      <div className="pointer-events-none sticky top-0 z-0 h-svh overflow-hidden">
        <AutoplayVideo
          mp4="/videos/tx-hero-v1.mp4"
          poster="/images/tx-hero-v1-poster.jpg"
          alt="Contractors working on homes"
          className="h-full w-full"
          videoClassName="h-full w-full object-cover"
        />
        {/* Scrim. The footage is daylight and the type is white, so without
            this the headline is unreadable over the bright frames. Heavier at
            the bottom so the section below has something to emerge from. */}
        <div className="absolute inset-0 bg-paper/70" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-paper" />
      </div>

      <div className="relative z-10 -mt-[100svh]">{children}</div>
    </section>
  );
}
