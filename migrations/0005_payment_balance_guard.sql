CREATE TRIGGER IF NOT EXISTS payments_no_overpayment
BEFORE INSERT ON payments
WHEN
  COALESCE((SELECT stage FROM orders WHERE id = NEW.order_id), 'Draft') = 'Draft'
  OR NEW.amount > COALESCE((
    SELECT SUM(ol.qty * (ol.unit_price + ol.decor_price)) - o.discount -
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.order_id = o.id)
    FROM orders o
    LEFT JOIN order_lines ol ON ol.order_id = o.id
    WHERE o.id = NEW.order_id
    GROUP BY o.id
  ), 0)
BEGIN
  SELECT RAISE(ABORT, 'Payment exceeds order balance');
END;
