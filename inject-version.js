/**
 * Version injection utility
 */

function injectVersionInfo(content, appVersion, deployTime) {
  // Replace version placeholders
  return content
    .replace(/\{\{VERSION\}\}/g, appVersion)
    .replace(/\{\{DEPLOY_TIME\}\}/g, deployTime)
    .replace(/\$\{VERSION\}/g, appVersion)
    .replace(/\$\{DEPLOY_TIME\}/g, deployTime);
}

module.exports = { injectVersionInfo };