-- Categories (public read catalog)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  color text NOT NULL
);

-- Subscriptions
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  costo numeric(10, 2) NOT NULL,
  frecuencia text NOT NULL CHECK (frecuencia IN ('mensual', 'anual', 'semanal')),
  categoria_id uuid REFERENCES categories(id),
  fecha_inicio date NOT NULL,
  proximo_cobro date NOT NULL,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'cancelada')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Billing history
CREATE TABLE billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  monto numeric(10, 2) NOT NULL
);

-- RLS: subscriptions (owner-only access)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_delete_own"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: billing_history (access via subscription ownership)
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_history_select_own"
  ON billing_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE subscriptions.id = billing_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "billing_history_insert_own"
  ON billing_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE subscriptions.id = billing_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "billing_history_update_own"
  ON billing_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE subscriptions.id = billing_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE subscriptions.id = billing_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "billing_history_delete_own"
  ON billing_history FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM subscriptions
      WHERE subscriptions.id = billing_history.subscription_id
        AND subscriptions.user_id = auth.uid()
    )
  );

-- Categories: public read (no restrictive RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

-- Seed categories
INSERT INTO categories (nombre, color) VALUES
  ('Streaming', '#E50914'),
  ('Servicios Cloud', '#0078D4'),
  ('Productividad', '#6366F1'),
  ('Bienestar', '#10B981'),
  ('Software', '#F59E0B'),
  ('Entretenimiento', '#EC4899');
