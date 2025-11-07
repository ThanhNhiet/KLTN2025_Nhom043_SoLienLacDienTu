const { Sequelize } = require("sequelize");
require("dotenv").config();

// Local MariaDB connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mariadb",
    port: process.env.DB_PORT || 3306,
    logging: false,
    dialectOptions: {
      charset: "utf8mb4",
      timezone: '+07:00', // for reading from database
    },
    timezone: '+07:00', // for writing to database
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  }
);


// Cloud MariaDB connection
// const sequelize = new Sequelize(
//   process.env.MARIADB_NAME,
//   process.env.MARIADB_USER,
//   process.env.MARIADB_PASS,
//   {
//     host: process.env.MARIADB_HOST,
//     dialect: "mariadb",
//     port: process.env.MARIADB_PORT,
//     logging: false,
//     dialectOptions: {
//       charset: "utf8mb4",
//       timezone: '+07:00',
//       ssl: {
//         require: true,
//         rejectUnauthorized: false,
//       },
//       connectTimeout: 60000,
//     },
//     timezone: '+07:00',
//     define: {
//       charset: "utf8mb4",
//       collate: "utf8mb4_unicode_ci",
//     },
//   }
// );

// Export the sequelize instance
// const sequelize = new Sequelize(
//   process.env.PG_DB,
//   process.env.PG_USER,
//   process.env.PG_PASS,
//   {
//     host: process.env.PG_HOST,
//     port: Number(process.env.PG_PORT || 5432),
//     dialect: 'postgres',
//     logging: false,
//     pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
//     dialectOptions: process.env.PG_SSL === 'true'
//       ? {
//           ssl: {
//             require: true,
//             rejectUnauthorized: false, // Neon dùng cert public, có thể bật true nếu bạn có CA
//           },
//         }
//       : undefined,
//   }
// );
module.exports = sequelize;
