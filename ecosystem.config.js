module.exports = {
  apps: [
    {
      name: "laubf_cms",
      script: "node_modules/.bin/next",
      args: "start -p 3012",
      cwd: "/home/ubfuser/digital_church/laubf_cms",
      env: {
        NODE_ENV: "production",
        PORT: 3012,
      },
    },
  ],
};
