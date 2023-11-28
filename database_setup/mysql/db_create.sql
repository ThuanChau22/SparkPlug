DROP DATABASE sparkplug;
CREATE SCHEMA sparkplug ;
USE sparkplug; 

CREATE TABLE User (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_type VARCHAR(10), 
    external_id VARCHAR(10),
    email VARCHAR(50),
    password VARCHAR(50),
    name VARCHAR(50),
    status VARCHAR(50),
    created DATETIME,
    modified DATETIME,
    INDEX (name),
    INDEX (status),
    INDEX (created)
);

CREATE TABLE Staff (
    id INT UNSIGNED,
    FOREIGN KEY (id) REFERENCES User(id)
);

CREATE TABLE Driver (
    id INT UNSIGNED,
    FOREIGN KEY (id) REFERENCES User(id)
);

CREATE TABLE Station_Owner (
    id INT UNSIGNED,
    FOREIGN KEY (id) REFERENCES User(id)
);

CREATE TABLE Zip_Code (
    zip CHAR(5) PRIMARY KEY,
    city VARCHAR(50),
    state CHAR(2)
);

CREATE TABLE Site (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id INT UNSIGNED,
    location POINT,
    name VARCHAR(255),
    street_address VARCHAR(255),
    created DATETIME,
    modified DATETIME,
    zip_code CHAR(5),
    FOREIGN KEY (owner_id) REFERENCES Station_Owner(id),
    FOREIGN KEY (zip_code) REFERENCES Zip_Code(zip),
    INDEX (name),
    INDEX (owner_id),
    INDEX (zip_code),
    INDEX (created)
);

CREATE TABLE Station (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mac_address VARCHAR(20),
    name VARCHAR(255),
    mech_status VARCHAR(20),
    elec_status VARCHAR(20),
    net_status VARCHAR(20),
    price DECIMAL(10,2),
    charge_level INT,
    connector_type VARCHAR(50),
    created DATETIME,
    modified DATETIME,
    coords POINT,
    site_id INT UNSIGNED,
    FOREIGN KEY (site_id) REFERENCES Site(id),
    INDEX (mech_status),
    INDEX (elec_status),
    INDEX (net_status),
    INDEX (charge_level),
    INDEX (connector_type),
    INDEX (site_id)
);
