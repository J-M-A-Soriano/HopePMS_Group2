-- Returns latest price per product
-- Drop view if exists
DROP VIEW IF EXISTS current_product_price;

--Create view
CREATE VIEW current_product_price AS
SELECT DISTINCT ON (prodcode)
  prodCode,
  unitprice AS price,
  created_at
FROM priceHist
WHERE record_status = 'ACTIVE'
ORDER BY prodcode, created_at DESC;

SELECT * FROM current_product_price;
