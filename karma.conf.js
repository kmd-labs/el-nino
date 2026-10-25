module.exports = async function (config) {
  const fs = require('fs');
  try {
    const { default: puppeteer } = await import('puppeteer');
    process.env.CHROME_BIN = puppeteer.executablePath();
  } catch {
    if (!process.env.CHROME_BIN) {
      if (fs.existsSync('/usr/bin/chromium')) {
        process.env.CHROME_BIN = '/usr/bin/chromium';
      } else if (fs.existsSync('/usr/bin/google-chrome')) {
        process.env.CHROME_BIN = '/usr/bin/google-chrome';
      } else {
        process.env.CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      }
    }
  }
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage/frontend"),
      subdir: ".",
      reporters: [{ type: "html" }, { type: "text-summary" }],
      check: {
        global: {
          statements: 20,
          branches: 15,
          functions: 15,
          lines: 20,
        },
      },
    },
    reporters: ["progress", "kjhtml"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["Chrome", "ChromeHeadlessCI"],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox", "--password-store=basic", "--use-mock-keychain"],
      },
    },
    singleRun: false,
    restartOnFileChange: true,
  });
};
