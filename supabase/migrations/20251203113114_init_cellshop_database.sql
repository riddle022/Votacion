/*
  # Cellshop Duty Free - Sistema Completo de Votación

  1. Nuevas Tablas
    - `vote_options` - Opciones disponibles para votación
      - `id` (uuid, primary key)
      - `text_pt` (text) - Texto en portugués
      - `text_es` (text) - Texto en español
      - `text_en` (text) - Texto en inglés
      - `is_active` (boolean) - Opción activa o inactiva
      - `display_order` (integer) - Orden de visualización
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `votes` - Registro de votos
      - `id` (uuid, primary key)
      - `vote_option_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `ip_address` (text, opcional)
    
    - `admin_users` - Usuarios administradores
      - `id` (uuid, primary key, foreign key a auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text) - 'admin' por defecto
      - `is_active` (boolean)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `vote_analytics` - Estadísticas de votación
      - `id` (uuid, primary key)
      - `total_votes` (integer)
      - `date` (date)
      - `created_at` (timestamp)

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas restrictivas de acceso
    - Solo usuarios autenticados pueden acceder al panel admin
    - El público anónimo solo puede votar

  3. Índices
    - Índices en foreign keys y campos de búsqueda frecuente
    - Mejora de performance en queries
*/

-- ============================================
-- TABLA: vote_options
-- ============================================
CREATE TABLE IF NOT EXISTS vote_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_pt text NOT NULL,
  text_es text NOT NULL,
  text_en text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLA: votes
-- ============================================
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_option_id uuid NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  ip_address text
);

-- ============================================
-- TABLA: admin_users
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'admin',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLA: vote_analytics
-- ============================================
CREATE TABLE IF NOT EXISTS vote_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_votes integer DEFAULT 0,
  date date NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS votes_option_id_idx ON votes(vote_option_id);
CREATE INDEX IF NOT EXISTS votes_created_at_idx ON votes(created_at);
CREATE INDEX IF NOT EXISTS vote_options_active_idx ON vote_options(is_active, display_order);
CREATE INDEX IF NOT EXISTS vote_options_order_idx ON vote_options(display_order);
CREATE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(email);
CREATE INDEX IF NOT EXISTS vote_analytics_date_idx ON vote_analytics(date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE vote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: vote_options
-- ============================================
-- Cualquier persona anónima puede ver opciones activas
CREATE POLICY "Anon can view active options"
  ON vote_options FOR SELECT
  TO anon
  USING (is_active = true);

-- Usuarios autenticados (admin) pueden ver todas las opciones
CREATE POLICY "Authenticated can view all options"
  ON vote_options FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin puede insertar opciones
CREATE POLICY "Admin can insert options"
  ON vote_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Solo admin puede actualizar opciones
CREATE POLICY "Admin can update options"
  ON vote_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Solo admin puede eliminar opciones
CREATE POLICY "Admin can delete options"
  ON vote_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================
-- POLÍTICAS: votes
-- ============================================
-- Cualquier persona puede votar (anon)
CREATE POLICY "Anyone can insert votes"
  ON votes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Solo admin puede ver todos los votos
CREATE POLICY "Admin can view all votes"
  ON votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================
-- POLÍTICAS: admin_users
-- ============================================
-- Usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admin puede actualizar su propio perfil
CREATE POLICY "Admin can update own profile"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'admin');

-- ============================================
-- POLÍTICAS: vote_analytics
-- ============================================
-- Solo admin puede ver analytics
CREATE POLICY "Admin can view analytics"
  ON vote_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================
-- DATOS INICIALES
-- ============================================
-- Insertar opciones de votación predeterminadas
INSERT INTO vote_options (text_pt, text_es, text_en, display_order, is_active)
VALUES
  ('Recomendação de amigos/família', 'Recomendación de amigos/familia', 'Friends/family recommendation', 1, true),
  ('Redes sociais (Instagram, Facebook)', 'Redes sociales (Instagram, Facebook)', 'Social media (Instagram, Facebook)', 2, true),
  ('Pesquisa no Google', 'Búsqueda en Google', 'Google search', 3, true),
  ('Passando pelo aeroporto', 'Pasando por el aeropuerto', 'Walking by the airport', 4, true),
  ('Propaganda/Anúncio', 'Publicidad/Anuncio', 'Advertisement', 5, true),
  ('Já conhecia de antes', 'Ya conocía de antes', 'Already knew from before', 6, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCIÓN: atualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_vote_options_updated_at BEFORE UPDATE ON vote_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
