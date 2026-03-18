const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

// Monorepo: resolve from root node_modules (workspaces hoist deps here)
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

// Explicit fallback for packages that may only exist in root
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@babel/runtime': path.resolve(monorepoRoot, 'node_modules/@babel/runtime'),
};

module.exports = config;