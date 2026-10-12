module.exports = async function (config) {
  const { default: puppeteer } = await import('puppeteer');
  process.env.CHROME_BIN = puppeteer.executablePath();
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
