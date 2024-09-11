DROP SCHEMA IF EXISTS group6;
CREATE SCHEMA group6;
USE group6;

CREATE TABLE User (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_type VARCHAR(10) NOT NULL,
    email VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'normal',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_email (email),
    KEY idx_name (name),
    KEY idx_status (status)
);

CREATE TABLE Staff (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    CONSTRAINT fk_Staff_User FOREIGN KEY (id)
    REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Driver (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    CONSTRAINT fk_Driver_User FOREIGN KEY (id)
    REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Station_Owner (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    CONSTRAINT fk_Station_Owner_User FOREIGN KEY (id)
    REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Site (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    owner_id INT UNSIGNED NOT NULL,
	latitude DECIMAL(9,6) NOT NULL,
	longitude DECIMAL(9,6) NOT NULL,
    name VARCHAR(255) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    zip_code INT NOT NULL,
    city VARCHAR(255) NOT NULL,
    state CHAR(2) NOT NULL,
    country VARCHAR(255) NOT NULL DEFAULT 'USA',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_name (name),
    KEY idx_owner_id (owner_id),
    KEY idx_zip_code (zip_code),
    CONSTRAINT fk_Site_Station_Owner FOREIGN KEY (owner_id)
    REFERENCES Station_Owner(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Station (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    -- status VARCHAR(20) NOT NULL DEFAULT 'Offline',
    -- price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    -- charge_level VARCHAR(50) NOT NULL,
    -- connector_type VARCHAR(50) NOT NULL,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    latitude DECIMAL(9,6) NOT NULL,
	longitude DECIMAL(9,6) NOT NULL,
    site_id INT UNSIGNED,
    CONSTRAINT fk_Station_Site FOREIGN KEY (site_id)
    REFERENCES Site(id) ON DELETE RESTRICT ON UPDATE CASCADE
    -- KEY idx_status (status),
    -- KEY idx_charge_level (charge_level),
    -- KEY idx_connector_type (connector_type)
);

CREATE TABLE EVSE (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    station_id INT UNSIGNED NOT NULL,
    evse_number INT UNSIGNED NOT NULL,
    connector_type VARCHAR(50) NOT NULL,
    -- status VARCHAR(20) NOT NULL DEFAULT 'Offline',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    charge_level VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	latitude DECIMAL(9,6),
	longitude DECIMAL(9,6),
    KEY idx_station_id (station_id),
    KEY idx_connector_type (connector_type),
    -- KEY idx_status (status),
    KEY idx_charge_level (charge_level),
    CONSTRAINT fk_EVSE_Station FOREIGN KEY (station_id)
    REFERENCES Station(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Trigger to increment EVSE number for each station
DELIMITER //
CREATE TRIGGER increment_evse_number
BEFORE INSERT ON EVSE
FOR EACH ROW
BEGIN
    SET NEW.evse_number = (
        SELECT IFNULL(MAX(evse_number), 0) + 1
        FROM EVSE
        WHERE station_id = NEW.station_id
    );
END;
//
DELIMITER ;

CREATE TABLE RFID_map (
    driver_id INT UNSIGNED,
    rfid CHAR(16),
    PRIMARY KEY (driver_id, rfid),
    UNIQUE (rfid),
    CONSTRAINT fk_RFID_map_Driver FOREIGN KEY (driver_id) 
    REFERENCES Driver(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE VIEW stations_joined AS
SELECT Station.id as station_id, Station.name as station_name, Station.latitude, Station.longitude,
site_id, owner_id, Site.latitude as site_latitude, Site.longitude as site_longitude,
Site.name as site_name, street_address, zip_code, city, state, country
FROM Station JOIN Site ON Station.site_id = Site.id;

CREATE VIEW evses_joined AS
SELECT Station.id as station_id, Station.name as station_name, Station.latitude, Station.longitude,
site_id, owner_id, Site.latitude as site_latitude, Site.longitude as site_longitude,
Site.name as site_name, street_address, zip_code, city, state, country, 
EVSE.id as evse_id, evse_number, price, charge_level, connector_type, EVSE.latitude as evse_latitude, EVSE.longitude as evse_longitude
FROM Station JOIN Site ON Station.site_id = Site.id JOIN EVSE ON Station.id = EVSE.station_id;