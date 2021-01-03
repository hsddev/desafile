/*
 * Create and export configuration variables
 *
 */

const process = require("process");
const path = require("path");

const env = process.env.NODE_ENV;

// Container for all environments
const environments = {};

// Staging (default) environment
environments.staging = {
  db: {
    host: "localhost",
    user: "root",
    password: "101201230",
    database: "node",
    dialect: "mysql",
  },
  httpPort: 3000,
  uploadDest: path.join(path.resolve(), "uploads"), // folder to upload files
  avatarsDest: path.join(path.resolve(), "avatars"), // folder where will be uploaded users avatars
  deleteTime: 48, // 2 days // in houres, time for deleted permanently the deleted by user files
  sgToken:
    "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", // send grid
  sessionSecret: "sln20239njhiondjadnl", // session secret
  cookieAge: 12, // houres
  resetPasswordTokenAge: 12, // houres
  envName: "staging",
};

// Production environment
// Production environment
environments.production = {
  db: {
    host: "localhost",
    port: 3306,
    user: "desafile",
    password: "DB_Pass",
    database: "desafile",
    dialect: "mysql",
  },
  httpPort: process.env.PORT,
  uploadDest: path.join("\\\\Ute-oym-honaine\\desafile", "uploads"),
  avatarsDest: path.join(path.resolve(), "avatars"),
  deleteTime: 48, // 2 days // in houres,
  sgToken:
    "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",
  sessionSecret: "sln20239njhiondjadnl",
  cookieAge: 12, // houres
  resetPasswordTokenAge: 12, // houres
  envName: "production",
};

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof env === "string" ? env.toLowerCase() : "";

// Check that the current environment is one of the environments above, if not default to staging
const environmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments.staging;

// Export the module
module.exports = environmentToExport;
