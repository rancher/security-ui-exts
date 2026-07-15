const path = require('path');
const config = require('@rancher/shell/vue.config');

module.exports = () => {
  const vendorConfig = config(__dirname, { excludes: [] });

  // Extend the chainWebpack hook to add our alias
  if (typeof vendorConfig.chainWebpack === 'function') {
    const originalChainWebpack = vendorConfig.chainWebpack;

    vendorConfig.chainWebpack = (webpackConfig) => {
      // Call the original chainWebpack configuration first
      originalChainWebpack(webpackConfig);
      // Add the @vulnerability-scanner alias pointing to the pkg/vulnerability-scanner folder
      webpackConfig.resolve.alias.set('@vulnerability-scanner', path.resolve(__dirname, 'pkg/vulnerability-scanner'));
      // Add the @runtime-enforcer alias pointing to the pkg/runtime-enforcer folder
      webpackConfig.resolve.alias.set('@runtime-enforcer', path.resolve(__dirname, 'pkg/runtime-enforcer'));
      // Add the @common alias pointing to the pkg/common folder, shared across extensions
      webpackConfig.resolve.alias.set('@common', path.resolve(__dirname, 'pkg/common'));
    };
  } else {
    vendorConfig.chainWebpack = (webpackConfig) => {
      webpackConfig.resolve.alias.set('@vulnerability-scanner', path.resolve(__dirname, 'pkg/vulnerability-scanner'));
      webpackConfig.resolve.alias.set('@runtime-enforcer', path.resolve(__dirname, 'pkg/runtime-enforcer'));
      webpackConfig.resolve.alias.set('@common', path.resolve(__dirname, 'pkg/common'));
    };
  }

  return vendorConfig;
};