CREATE DATABASE IF NOT EXISTS doaaqui
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE doaaqui;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id INT UNSIGNED NOT NULL,
  type ENUM('BEM', 'SERVICO') NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state CHAR(2) NOT NULL,
  image_url VARCHAR(500),
  delivery_method ENUM('RETIRADA', 'ENTREGA', 'COMBINAR') DEFAULT 'COMBINAR',
  status ENUM('DISPONIVEL', 'RESERVADA', 'CONCLUIDA', 'CANCELADA')
    DEFAULT 'DISPONIVEL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_donation_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE donation_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  donation_id INT UNSIGNED NOT NULL,
  requester_id INT UNSIGNED NOT NULL,
  message VARCHAR(500) NOT NULL,
  status ENUM('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA')
    DEFAULT 'PENDENTE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_request (donation_id, requester_id),
  CONSTRAINT fk_request_donation
    FOREIGN KEY (donation_id) REFERENCES donations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_request_user
    FOREIGN KEY (requester_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_donations_search
  ON donations(status, type, category, city, state);

CREATE INDEX idx_requests_owner
  ON donation_requests(donation_id, status);
