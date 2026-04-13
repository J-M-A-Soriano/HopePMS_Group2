CREATE TABLE employee (empno VARCHAR(5) NOT NULL PRIMARY KEY, 
												lastname VARCHAR(15),  
												firstname VARCHAR(15), 
												gender CHAR(1) CONSTRAINT gender_ck CHECK (gender in ('M','F')), 
												birthdate DATE, 
												hiredate DATE, 
												sepDate DATE);



-- Create DEPARTMENT
CREATE TABLE department (deptCode VARCHAR(3) NOT NULL,
												  deptName VARCHAR (20), 
												  PRIMARY KEY (deptCode)) ;


-- Create JOB 
CREATE TABLE job (jobCode VARCHAR(4) NOT NULL PRIMARY KEY, 
									 jobDesc VARCHAR(20)) ;



-- Create jobHistory
CREATE TABLE jobHistory (empNo VARCHAR(5) NOT NULL REFERENCES employee,
												  jobCode VARCHAR(4) NOT NULL REFERENCES job, 
												  effDate DATE NOT NULL , 
												  salary DECIMAL(10,2) CONSTRAINT salary_ck 
												  CHECK (salary >= 0.0), deptCode VARCHAR(4),
												  PRIMARY KEY (empNo, jobCode,effDate), 
												  FOREIGN KEY (deptCode) REFERENCES department);



-- Create table Customer
CREATE TABLE customer (custno VARCHAR(5) NOT NULL PRIMARY KEY, 
											   custname VARCHAR(20), 
											   address VARCHAR(50), 
											   payterm VARCHAR(3) CONSTRAINT pay_ck 
											   CHECK (payterm IN ('COD', '30D', '45D'))) ;



-- Create sales
CREATE TABLE  sales (transNo VARCHAR(8) NOT NULL PRIMARY KEY, 
												salesDate DATE, 
												custNo VARCHAR(5), 
												empNo VARCHAR(5), 	
												FOREIGN KEY (custNo) REFERENCES customer, 
												FOREIGN KEY (empno) REFERENCES employee);


-- Create PRODUCT
CREATE TABLE product (prodCode VARCHAR(6) NOT NULL PRIMARY KEY, 
											description VARCHAR(30), 
											unit VARCHAR(3) CONSTRAINT unit_ck 
											CHECK (unit IN ('pc','ea','mtr','pkg','ltr')));

											

-- Create salesDETAIL
CREATE TABLE salesDetail (transNo VARCHAR(8) NOT NULL REFERENCES sales, 
													prodCode VARCHAR(6) NOT NULL REFERENCES product, 
													quantity DECIMAL(10,2) CONSTRAINT quantity_ck 
													CHECK (quantity >= 0.0), 
													PRIMARY KEY (transNo, prodCode));
													


-- Create table PAYMENT
CREATE TABLE payment (orNo VARCHAR(8) NOT NULL PRIMARY KEY, 
											  payDate DATE, 
											  amount DECIMAL(10,2), 
											  transno VARCHAR(8) REFERENCES  sales);



-- Create table PRICEHIST
CREATE TABLE priceHist (effDate DATE NOT NULL, 
											   prodCode VARCHAR(6) NOT NULL REFERENCES product, 
											   unitPrice DECIMAL(10,2) CONSTRAINT unitP_ck 
											   CHECK (unitPrice > 0),  
											   PRIMARY KEY (effDate, prodCode));



-- MODULE table
CREATE TABLE module (
    moduleId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moduleName VARCHAR(50) NOT NULL
);

-- USER MODULE table
CREATE TABLE userModule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES "user"(userid),
    moduleId UUID REFERENCES module(moduleId)
);

-- RIGHTS table
CREATE TABLE rights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rightName VARCHAR(50)
);

-- USER MODULE RIGHTS table
CREATE TABLE userModuleRights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID REFERENCES "user"(userid),
    moduleId UUID REFERENCES module(moduleId),
    rightAdd BOOLEAN DEFAULT false,
    rightEdit BOOLEAN DEFAULT false,
    rightDel BOOLEAN DEFAULT false,
    rightView BOOLEAN DEFAULT false
);

