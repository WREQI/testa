-- Security and trading correctness constraints. Run after the baseline schema exists.
CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_key ON app_users (lower(email));
ALTER TABLE trading_order ADD COLUMN IF NOT EXISTS client_order_id varchar(100);
CREATE UNIQUE INDEX IF NOT EXISTS trading_order_user_client_order_key
  ON trading_order (user_id, client_order_id) WHERE client_order_id IS NOT NULL;
ALTER TABLE trading_order ADD CONSTRAINT trading_order_direction_check
  CHECK (direction IN ('buy', 'sell'));
ALTER TABLE trading_order ADD CONSTRAINT trading_order_positive_check
  CHECK (price > 0 AND quantity > 0 AND quantity % 100 = 0);
