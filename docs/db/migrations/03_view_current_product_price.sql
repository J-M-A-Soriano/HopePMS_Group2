-- 1. List all customers
SELECT * FROM customer;

-- 2. List all products
SELECT * FROM product;

-- 3. List all employees
SELECT * FROM employee;


-- 4. Show all sales transactions with customer name
SELECT s.transNo, c.custName, s.salesDate
FROM sales s, customer c
WHERE s.custNo = c.custNo;

-- 5. Show sales details with product description
SELECT sd.transNo, p.description, sd.quantity
FROM salesDetail sd, product p
WHERE sd.prodCode = p.prodCode;

-- 6. Full sales report (transaction + customer + product)
SELECT s.transNo, c.custName, p.description, sd.quantity
FROM sales s, customer c, salesDetail sd, product p
WHERE s.custNo = c.custNo
AND s.transNo = sd.transNo
AND sd.prodCode = p.prodCode;


-- 7. Total quantity sold per product
SELECT prodCode, SUM(quantity) AS total_qty
FROM salesDetail
GROUP BY prodCode;

-- 8. Total sales per transaction
SELECT transNo, SUM(quantity) AS total_items
FROM salesDetail
GROUP BY transNo;

-- 9. Total payment amount
SELECT SUM(amount) AS total_payment
FROM payment;


-- 10. Customers with payments greater than 1000
SELECT transNo, SUM(amount) AS total_payment
FROM payment
GROUP BY transNo
HAVING SUM(amount) > 1000;

-- 11. Total quantity sold per product with description
SELECT p.description,
       SUM(sd.quantity) AS total_qty
FROM product p, salesDetail sd
WHERE p.prodCode = sd.prodCode
GROUP BY p.description;


-- 12. Top selling product
SELECT p.description,
       SUM(sd.quantity) AS total_qty
FROM product p, salesDetail sd
WHERE p.prodCode = sd.prodCode
GROUP BY p.description
ORDER BY total_qty DESC;

-- 13. Rank products by quantity sold
SELECT prodCode,
       SUM(quantity) AS total_qty,
       RANK() OVER (ORDER BY SUM(quantity) DESC) AS rank
FROM salesDetail
GROUP BY prodCode;

-- 14. Rank transactions by total items sold
SELECT transNo,
       SUM(quantity) AS total_items,
       RANK() OVER (ORDER BY SUM(quantity) DESC) AS rank
FROM salesDetail
GROUP BY transNo;


-- 15. Show active products only
SELECT * FROM product
WHERE record_status = 'ACTIVE';

-- 16. Show active customers only
SELECT * FROM customer
WHERE record_status = 'ACTIVE';


-- 17. Detailed report with filter (only ACTIVE records)
SELECT s.transNo, c.custName, p.description, sd.quantity
FROM sales s, customer c, salesDetail sd, product p
WHERE s.custNo = c.custNo
AND s.transNo = sd.transNo
AND sd.prodCode = p.prodCode
AND s.record_status = 'ACTIVE'
AND c.record_status = 'ACTIVE'
AND p.record_status = 'ACTIVE';

-- FORCE UPDATE