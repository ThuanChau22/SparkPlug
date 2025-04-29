DROP SCHEMA IF EXISTS sparkplug;
CREATE SCHEMA sparkplug;
USE sparkplug;

CREATE TABLE User (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    status ENUM('active','blocked','terminated') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
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

CREATE TABLE RFID_map (
    driver_id INT UNSIGNED,
    rfid CHAR(16),
    PRIMARY KEY (driver_id, rfid),
    UNIQUE (rfid),
    CONSTRAINT fk_RFID_map_Driver FOREIGN KEY (driver_id) 
    REFERENCES Driver(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Station_Owner (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    CONSTRAINT fk_Station_Owner_User FOREIGN KEY (id)
    REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Site (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT ,
    owner_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
	latitude DECIMAL(9,6) NOT NULL,
	longitude DECIMAL(9,6) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state CHAR(2) NOT NULL,
    country VARCHAR(255) NOT NULL DEFAULT 'USA',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_owner_id (owner_id),
    KEY idx_zip_code (zip_code),
    FULLTEXT KEY idx_txt_name (name),
	FULLTEXT KEY idx_txt_city (city),
	FULLTEXT KEY idx_txt_state (state),
	FULLTEXT KEY idx_txt_zip_code (zip_code),
	FULLTEXT KEY idx_txt_country (country),
	FULLTEXT KEY idx_txt_street_address (street_address),
	FULLTEXT KEY idx_txt_name_street_city_state_zip_country (name,street_address,city,state,zip_code,country),
    CONSTRAINT fk_Site_Station_Owner FOREIGN KEY (owner_id)
    REFERENCES Station_Owner(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Station (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
	longitude DECIMAL(9,6) NOT NULL,
    site_id INT UNSIGNED NOT NULL,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_Station_Site FOREIGN KEY (site_id)
    REFERENCES Site(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE EVSE (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    station_id INT UNSIGNED NOT NULL,
    evse_id INT UNSIGNED NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
	longitude DECIMAL(9,6) NOT NULL,
    connector_type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    charge_level VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_station_id_evse_id (station_id,evse_id),
    KEY idx_station_id (station_id),
    KEY idx_connector_type (connector_type),
    KEY idx_charge_level (charge_level),
    CONSTRAINT fk_EVSE_Station FOREIGN KEY (station_id)
    REFERENCES Station(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Trigger to increment EVSE id for each station
DELIMITER //
CREATE TRIGGER increment_evse_id
BEFORE INSERT ON EVSE
FOR EACH ROW
BEGIN
    SET NEW.evse_id = (
        SELECT IFNULL(MAX(evse_id), 0) + 1
        FROM EVSE WHERE station_id = NEW.station_id
    );
END;
//
DELIMITER ;

-- Haversine function
DELIMITER //
CREATE FUNCTION haversine(lat1 DOUBLE, lon1 DOUBLE, lat2 DOUBLE, lon2 DOUBLE)
RETURNS DOUBLE NO SQL DETERMINISTIC
BEGIN
  RETURN 6371 * (ACOS(
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * COS(RADIANS(lon2) - RADIANS(lon1))
    + SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
  ));
END;
//
DELIMITER ;

CREATE VIEW users_joined AS
SELECT
    u.id AS id,
    u.email AS email,
    u.password AS password,
    u.name AS name,
    u.status AS status,
    IF((s.id IS NOT NULL), TRUE, FALSE) AS staff,
    IF((o.id IS NOT NULL), TRUE, FALSE) AS owner,
    IF((d.id IS NOT NULL), TRUE, FALSE) AS driver,
    u.created_at AS created_at,
    u.updated_at AS updated_at
FROM User u
LEFT JOIN Staff s ON u.id = s.id
LEFT JOIN Station_Owner o ON u.id = o.id
LEFT JOIN Driver d ON u.id = d.id;

CREATE VIEW stations_joined AS
SELECT 
	ss.id AS id,
	ss.name AS name,
	ss.latitude AS latitude,
	ss.longitude AS longitude,
	ss.site_id AS site_id,
	s.owner_id AS owner_id,
	s.latitude AS site_latitude,
	s.longitude AS site_longitude,
	s.name AS site_name,
	s.street_address AS street_address,
	s.zip_code AS zip_code,
	s.city AS city,
	s.state AS state,
	s.country AS country,
	ss.created_at AS created_at,
	ss.updated_at AS updated_at
FROM Site s JOIN Station ss ON s.id = ss.site_id;

CREATE VIEW evses_joined AS
SELECT 
    e.id AS id,
    e.station_id AS station_id,
    e.evse_id AS evse_id,
    e.connector_type AS connector_type,
    e.price AS price,
    e.charge_level AS charge_level,
    s.name AS station_name,
    s.latitude AS latitude,
    s.longitude AS longitude,
    s.site_id AS site_id,
    s.owner_id AS owner_id,
    s.site_latitude AS site_latitude,
    s.site_longitude AS site_longitude,
    s.site_name AS site_name,
    s.street_address AS street_address,
    s.zip_code AS zip_code,
    s.city AS city,
    s.state AS state,
    s.country AS country,
    e.created_at AS created_at,
	e.updated_at AS updated_at
FROM stations_joined s JOIN EVSE e ON s.id = e.station_id;
