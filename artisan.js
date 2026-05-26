#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sequelize = require('./bootstrap/database');

const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

const commands = {
  'migrate': async () => {
    const dir = path.join(__dirname, 'database', 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();

    for (const file of files) {
      const migration = require(path.join(dir, file));
      console.log(`Running migration: ${file}`);
      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    }
    console.log('Migrations completed.');
    process.exit(0);
  },

  'migrate:fresh': async () => {
    const dir = path.join(__dirname, 'database', 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().reverse();

    for (const file of files) {
      const migration = require(path.join(dir, file));
      console.log(`Reverting migration: ${file}`);
      try { await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize); } catch (e) {}
    }

    for (const file of files.reverse()) {
      const migration = require(path.join(dir, file));
      console.log(`Running migration: ${file}`);
      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    }
    console.log('Fresh migrations completed.');
    process.exit(0);
  },

  'db:seed': async () => {
    const dir = path.join(__dirname, 'database', 'seeders');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();

    for (const file of files) {
      const seeder = require(path.join(dir, file));
      console.log(`Seeding: ${file}`);
      await seeder.run();
    }
    console.log('Seeding completed.');
    process.exit(0);
  },

  'make:controller': () => {
    if (!param) return console.error('Usage: artisan make:controller <Name>');
    const file = path.join(__dirname, 'app', 'Http', 'Controllers', `${param}.js`);
    const content = `const Controller = require('./Controller');\n\nclass ${param} extends Controller {\n  async index(req, res) {\n    return this.success(res, []);\n  }\n}\n\nmodule.exports = new ${param}();\n`;
    fs.writeFileSync(file, content);
    console.log(`Controller created: app/Http/Controllers/${param}.js`);
  },

  'make:model': () => {
    if (!param) return console.error('Usage: artisan make:model <Name>');
    const file = path.join(__dirname, 'app', 'Models', `${param}.js`);
    const content = `const { DataTypes, Model } = require('sequelize');\nconst sequelize = require('../../bootstrap/database');\n\nclass ${param} extends Model {}\n\n${param}.init({\n  // attributes\n}, {\n  sequelize,\n  modelName: '${param}',\n  tableName: '${param.toLowerCase()}s',\n  timestamps: true,\n});\n\nmodule.exports = ${param};\n`;
    fs.writeFileSync(file, content);
    console.log(`Model created: app/Models/${param}.js`);
  },

  'make:middleware': () => {
    if (!param) return console.error('Usage: artisan make:middleware <Name>');
    const file = path.join(__dirname, 'app', 'Http', 'Middleware', `${param}.js`);
    const content = `module.exports = (req, res, next) => {\n  // logic here\n  next();\n};\n`;
    fs.writeFileSync(file, content);
    console.log(`Middleware created: app/Http/Middleware/${param}.js`);
  },

  'make:migration': () => {
    if (!param) return console.error('Usage: artisan make:migration <name>');
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const file = path.join(__dirname, 'database', 'migrations', `${timestamp}_${param}.js`);
    const content = `module.exports = {\n  async up(queryInterface, Sequelize) {\n    // await queryInterface.createTable('table_name', { ... });\n  },\n\n  async down(queryInterface, Sequelize) {\n    // await queryInterface.dropTable('table_name');\n  },\n};\n`;
    fs.writeFileSync(file, content);
    console.log(`Migration created: database/migrations/${timestamp}_${param}.js`);
  },

  'help': () => {
    console.log(`
Laravel-Express Artisan CLI

Available commands:
  migrate              Run all pending migrations
  migrate:fresh        Drop all tables and re-run migrations
  db:seed              Seed the database
  make:controller      Create a new controller
  make:model           Create a new model
  make:middleware      Create a new middleware
  make:migration       Create a new migration
  help                 Show this help
`);
  },
};

(async () => {
  if (!command || !commands[command]) {
    commands.help();
    process.exit(0);
  }
  try {
    await commands[command]();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
