module.exports = {
  apps: [
    {
      name: "laubf",
      script: "node_modules/.bin/next",
      args: "start -p 3011",
      cwd: "/home/ubfuser/digital_church/laubf",
      env: {
        NODE_ENV: "production",
        PORT: 3011,
      },
    },
  ],
};
