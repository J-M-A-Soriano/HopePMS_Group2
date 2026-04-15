CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USER
CREATE TABLE "user" (
    userid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    user_type VARCHAR(20),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EMPLOYEE
CREATE TABLE employee (
    empno VARCHAR(5) PRIMARY KEY,
    lastname VARCHAR(15) NOT NULL,
    firstname VARCHAR(15) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('M','F')),
    birthdate DATE,
    hiredate DATE,
    sep_date DATE,
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DEPARTMENT
CREATE TABLE department (
    deptCode VARCHAR(3) PRIMARY KEY,
    deptName VARCHAR(20) NOT NULL,
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- JOB
CREATE TABLE job (
    jobCode VARCHAR(4) PRIMARY KEY,
    jobDesc VARCHAR(20) NOT NULL,
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- JOB HISTORY
CREATE TABLE jobHistory (
    empNo VARCHAR(5),
    jobCode VARCHAR(4),
    effDate DATE,
    salary DECIMAL(10,2) CHECK (salary >= 0),
    deptCode VARCHAR(3),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (empNo, jobCode, effDate),
    FOREIGN KEY (empNo) REFERENCES employee(empno),
    FOREIGN KEY (jobCode) REFERENCES job(jobCode),
    FOREIGN KEY (deptCode) REFERENCES department(deptCode)
);

-- CUSTOMER
CREATE TABLE customer (
    custNo VARCHAR(5) PRIMARY KEY,
    custName VARCHAR(20) NOT NULL,
    address VARCHAR(50),
    payterm VARCHAR(3) CHECK (payterm IN ('COD','30D','45D')),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SALES
CREATE TABLE sales (
    transNo VARCHAR(8) PRIMARY KEY,
    salesDate DATE,
    custNo VARCHAR(5),
    empNo VARCHAR(5),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custNo) REFERENCES customer(custNo),
    FOREIGN KEY (empNo) REFERENCES employee(empno)
);

-- PRODUCT
CREATE TABLE product (
    prodCode VARCHAR(6) PRIMARY KEY,
    description VARCHAR(30) NOT NULL,
    unit VARCHAR(3) CHECK (unit IN ('pc','ea','mtr','pkg','ltr')),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SALES DETAIL
CREATE TABLE salesDetail (
    transNo VARCHAR(8),
    prodCode VARCHAR(6),
    quantity DECIMAL(10,2) CHECK (quantity >= 0),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (transNo, prodCode),
    FOREIGN KEY (transNo) REFERENCES sales(transNo),
    FOREIGN KEY (prodCode) REFERENCES product(prodCode)
);

-- PAYMENT
CREATE TABLE payment (
    orNo VARCHAR(8) PRIMARY KEY,
    payDate DATE,
    amount DECIMAL(10,2),
    transNo VARCHAR(8),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transNo) REFERENCES sales(transNo)
);

-- PRICE HISTORY
CREATE TABLE priceHist (
    effDate DATE,
    prodCode VARCHAR(6),
    unitPrice DECIMAL(10,2) CHECK (unitPrice > 0),
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (effDate, prodCode),
    FOREIGN KEY (prodCode) REFERENCES product(prodCode)
);

-- MODULE
CREATE TABLE module (
    moduleId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moduleName VARCHAR(50) NOT NULL,
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER MODULE
CREATE TABLE userModule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID,
    moduleId UUID,
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES "user"(userid),
    FOREIGN KEY (moduleId) REFERENCES module(moduleId)
);

-- RIGHTS
CREATE TABLE rights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rightName VARCHAR(50) NOT NULL,
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER MODULE RIGHTS
CREATE TABLE userModuleRights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID,
    moduleId UUID,
    rightAdd BOOLEAN DEFAULT false,
    rightEdit BOOLEAN DEFAULT false,
    rightDel BOOLEAN DEFAULT false,
    rightView BOOLEAN DEFAULT false,
    record_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES "user"(userid),
    FOREIGN KEY (moduleId) REFERENCES module(moduleId)
);

-- FORCE UPDATE