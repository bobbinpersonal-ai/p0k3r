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
      { source: "/crew", destination: "/partners", permanent: true },

      // Short aliases for /channel-partners, which is a mouthful to say down a
      // phone and gets texted to somebody mid-cold-call. Temporary rather than
      // permanent on purpose: a 308 is cached by the browser more or less
      // forever, and these are vanity links we may well want to repoint.
      { source: "/partner", destination: "/channel-partners", permanent: false },
      { source: "/refer", destination: "/channel-partners", permanent: false },
    ];
  },
};

export default nextConfig;
