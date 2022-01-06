// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

module.exports = function (_wallaby) {
  const packageNames = ["backend", "encoding", "crypto", "frontend"];
  const packages =
    packageNames.length === 1 ? packageNames[0] : `{${packageNames.join(",")}}`;
  const directories = `./packages/${packages}/{src,test}/**/`;
  const sourceFiles = directories + "*.{ts,mjs,cjs,js,json,env}";
  const testFiles = directories + "*.test.ts";
  const packageJsonFiles = `./packages/${packages}/package.json`;

  return {
    files: [".env", sourceFiles, packageJsonFiles, "!" + testFiles],
    tests: [testFiles],
    testFramework: "mocha",
    runMode: "onsave",
    env: {
      type: "node",
    },
  };
};
