/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces the trimmed .next/standalone output the Dockerfile copies
  // into the final image — without this, `docker build` will fail to
  // find that directory.
  output: "standalone",
};
module.exports = nextConfig;
