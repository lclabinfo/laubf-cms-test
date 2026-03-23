module.exports = {
  apps: [
    {
      name: "laubf_cms",
      script: ".next/standalone/server.js",
      cwd: "/home/ubfuser/digital_church/laubf_cms",
      node_args: "--max-old-space-size=256",
      env: {
        NODE_ENV: "production",
        PORT: 3012,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
