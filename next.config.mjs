/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // /sell and /crew collapsed into /partners when the business became a
    // referral network. Both URLs are already in job ads, on printed cards and
    // in the footer of everything sent so far, so they redirect rather than
    // 404.
    //
    // These live here rather than as permanentRedirect() in a page component:
    // those pages prerender as static, the redirect never fires at request
    // time, and the visitor gets a blank page instead. Config redirects are
    // handled before rendering and actually work.
    return [
      { source: "/sell", destination: "/partners", permanent: true },

      // /crew used to redirect here too. It is now the crews' own portal —
      // their jobs, the price book and the paperwork to close one — so the
      // redirect is gone. Anyone whose browser cached the old 308 will still
      // be sent to /partners until that cache expires; the sub-paths
      // (/crew/login, /crew/jobs/...) were never redirected, so the links we
      // actually send people are unaffected.

      // Short aliases for /channel-partners, which is a mouthful to say down a
      // phone and gets texted to somebody mid-cold-call. Temporary rather than
      // permanent on purpose: a 308 is cached by the browser more or less
      // forever, and these are vanity links we may well want to repoint.
      //
      // /2000 is the one to say out loud, and it is digits on purpose. The
      // call says "about two thousand dollars" three times, so the link is the
      // number they have just heard — and a number survives an accent and a
      // bad line where a word does not. "Slash earn" is heard as "urn" or
      // "learn"; "slash two thousand" is not heard as anything else.
      //
      // It also sidesteps the singular/plural trap: /partner is this page and
      // /partners is the crew recruiting page, so anybody who guesses the
      // plural lands on a completely different offer. See the note on that
      // page, which catches them.
      { source: "/2000", destination: "/channel-partners", permanent: false },
      { source: "/partner", destination: "/channel-partners", permanent: false },
      { source: "/refer", destination: "/channel-partners", permanent: false },
    ];
  },
};

export default nextConfig;
