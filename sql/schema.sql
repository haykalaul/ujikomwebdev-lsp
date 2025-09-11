-- Buat database sesuai .env, lalu jalankan jika ingin membuat manual
CREATE DATABASE IF NOT EXISTS luas_volume_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE luas_volume_db;

CREATE TABLE IF NOT EXISTS calculations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  name VARCHAR(255),
  school VARCHAR(255),
  age INT,
  address TEXT,
  phone VARCHAR(50),
  shape VARCHAR(50),
  type VARCHAR(20),
  parameters JSON,
  result DOUBLE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
