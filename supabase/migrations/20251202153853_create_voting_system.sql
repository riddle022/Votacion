/*
  # Cellshop Duty Free - Sistema de Votação

  1. Novas Tabelas
    - `vote_options`
      - `id` (uuid, primary key)
      - `text_pt` (text) - Texto em português
      - `text_es` (text) - Texto em espanhol
      - `text_en` (text) - Texto em inglês
      - `is_active` (boolean) - Se a opção está ativa
      - `display_order` (integer) - Ordem de exibição
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `votes`
      - `id` (uuid, primary key)
      - `vote_option_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `ip_address` (text) - Opcional para tracking

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para leitura pública de vote_options ativas
    - Políticas para inserção pública de votes
    - Políticas para admin gerenciar vote_options
    - Políticas para admin visualizar todos os votes
*/

-- Criar tabela de opções de votação
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

-- Criar tabela de votos
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_option_id uuid NOT NULL REFERENCES vote_options(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  ip_address text
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS votes_option_id_idx ON votes(vote_option_id);
CREATE INDEX IF NOT EXISTS votes_created_at_idx ON votes(created_at);
CREATE INDEX IF NOT EXISTS vote_options_active_idx ON vote_options(is_active, display_order);

-- Habilitar RLS
ALTER TABLE vote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Políticas para vote_options
-- Qualquer pessoa pode ver opções ativas
CREATE POLICY "Qualquer pessoa pode ver opções ativas"
  ON vote_options FOR SELECT
  TO anon
  USING (is_active = true);

-- Usuários autenticados podem ver todas as opções
CREATE POLICY "Admin pode ver todas as opções"
  ON vote_options FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir opções
CREATE POLICY "Admin pode inserir opções"
  ON vote_options FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários autenticados podem atualizar opções
CREATE POLICY "Admin pode atualizar opções"
  ON vote_options FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem deletar opções
CREATE POLICY "Admin pode deletar opções"
  ON vote_options FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para votes
-- Qualquer pessoa pode inserir votos
CREATE POLICY "Qualquer pessoa pode votar"
  ON votes FOR INSERT
  TO anon
  WITH CHECK (true);

-- Usuários autenticados podem ver todos os votos
CREATE POLICY "Admin pode ver todos os votos"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

-- Inserir opções padrão
INSERT INTO vote_options (text_pt, text_es, text_en, display_order) VALUES
  ('Recomendação de amigos/família', 'Recomendación de amigos/familia', 'Friends/family recommendation', 1),
  ('Redes sociais (Instagram, Facebook)', 'Redes sociales (Instagram, Facebook)', 'Social media (Instagram, Facebook)', 2),
  ('Pesquisa no Google', 'Búsqueda en Google', 'Google search', 3),
  ('Passando pelo aeroporto', 'Pasando por el aeropuerto', 'Walking by the airport', 4),
  ('Propaganda/Anúncio', 'Publicidad/Anuncio', 'Advertisement', 5),
  ('Já conhecia de antes', 'Ya conocía de antes', 'Already knew from before', 6)
ON CONFLICT DO NOTHING;
