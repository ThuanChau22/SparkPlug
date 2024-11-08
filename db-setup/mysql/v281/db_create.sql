DROP SCHEMA IF EXISTS sparkplug;
CREATE SCHEMA sparkplug;
USE sparkplug;

CREATE TABLE User (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    -- user_type VARCHAR(10) NOT NULL,
    email VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Normal',
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

CREATE TABLE Zip_Code (
    zip CHAR(5) NOT NULL PRIMARY KEY,
    city VARCHAR(50) NOT NULL,
    state CHAR(2) NOT NULL
);

CREATE TABLE Site (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    owner_id INT UNSIGNED NOT NULL,
    -- location POINT NOT NULL,
	latitude VARCHAR(20),
	longitude VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    zip_code CHAR(5) NOT NULL,
    KEY idx_name (name),
    KEY idx_owner_id (owner_id),
    KEY idx_zip_code (zip_code),
    CONSTRAINT fk_Site_Station_Owner FOREIGN KEY (owner_id)
    REFERENCES Station_Owner(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_Site_Zip_Code FOREIGN KEY (zip_code)
    REFERENCES Zip_Code(zip) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE Station (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Unavailable',
    -- elec_status VARCHAR(20) NOT NULL,
    -- net_status VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    charge_level VARCHAR(50) NOT NULL,
    connector_type VARCHAR(50) NOT NULL,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- coords POINT,
    latitude VARCHAR(20),
	longitude VARCHAR(20),
    site_id INT UNSIGNED,
    CONSTRAINT fk_Station_Site FOREIGN KEY (site_id)
    REFERENCES Site(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    KEY idx_status (status),
    KEY idx_charge_level (charge_level),
    KEY idx_connector_type (connector_type)
);

CREATE TABLE RFID_map (
    driver_id INT UNSIGNED,
    rfid CHAR(16),
    PRIMARY KEY (driver_id, rfid),
    UNIQUE (rfid),
    CONSTRAINT fk_RFID_map_Driver FOREIGN KEY (driver_id) 
    REFERENCES Driver(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE VIEW stations_joined AS
SELECT Station.id, Station.name, status, price, charge_level, connector_type, 
Station.created_at, Station.updated_at, Station.latitude, Station.longitude,
site_id, owner_id, Site.latitude as site_latitude, Site.longitude as site_longitude,
Site.name as site_name, street_address, zip_code, city, state
FROM Station JOIN Site ON Station.site_id = Site.id JOIN Zip_Code ON Site.zip_code = Zip_Code.zip;