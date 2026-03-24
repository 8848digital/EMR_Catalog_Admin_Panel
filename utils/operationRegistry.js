// const operations = require('../operations');

// class OperationRegistry {
//   constructor() {
//     this.operations = new Map();
//     this.registerOperations();
//   }

//   registerOperations() {
//     Object.entries(operations).forEach(([key, operation]) => {
//       this.operations.set(key, operation);
//     });
//   }

//   getOperation(operationName) {
//     const operation = this.operations.get(operationName);
//     if (!operation) {
//       throw new Error(`Operation "${operationName}" not found`);
//     }
//     return operation;
//   }

//   getAllOperations() {
//     const result = [];
//     this.operations.forEach((operation, key) => {
//       result.push({
//         value: key,
//         label: operation.label
//       });
//     });
//     return result;
//   }

//   hasOperation(operationName) {
//     return this.operations.has(operationName);
//   }
// }

// module.exports = new OperationRegistry();

// utils/operationRegistry.js - With configuration support
const operations = require('../operations');
const fs = require('fs');
const path = require('path');

class OperationRegistry {
  constructor() {
    this.operations = new Map();
    this.config = this.loadConfig();
    this.registerOperations();
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, '../config/operationConfig.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('Error loading operation config:', error);
    }
    return { operations: [] };
  }

  registerOperations() {
    Object.entries(operations).forEach(([key, operation]) => {
      this.operations.set(key, operation);
    });
  }

  getOperation(operationName) {
    const operation = this.operations.get(operationName);
    if (!operation) {
      throw new Error(`Operation "${operationName}" not found`);
    }
    return operation;
  }

  getAllOperations() {
    const result = [];

    // Create a map for quick config lookup
    const configMap = new Map();
    this.config.operations.forEach(cfg => {
      configMap.set(cfg.key, cfg);
    });

    const currentSystem = process.env.System || '';

    this.operations.forEach((operation, key) => {
      const config = configMap.get(key);

      // Strict filtering: visible must be true and system must match env.System
      const isVisible = config && config.visible === true;
      const systemMatches = config && config.system &&
        (Array.isArray(config.system) ? config.system.includes(currentSystem) : config.system === currentSystem);

      if (isVisible && systemMatches) {
        result.push({
          value: key,
          label: operation.label,
          order: config?.order || 999
        });
      }
    });

    // Sort by order
    result.sort((a, b) => a.order - b.order);

    return result;
  }

  hasOperation(operationName) {
    return this.operations.has(operationName);
  }

  isOperationVisible(operationName) {
    const config = this.config.operations.find(op => op.key === operationName);
    const currentSystem = process.env.System || '';
    const systemMatches = config && config.system &&
      (Array.isArray(config.system) ? config.system.includes(currentSystem) : config.system === currentSystem);
    return config && config.visible === true && systemMatches;
  }
}

module.exports = new OperationRegistry();