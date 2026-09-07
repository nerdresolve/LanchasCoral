-- Vídeo de fundo do hero, por modelo.
-- Nulo em todos os registros existentes: sem vídeo, o hero segue exatamente
-- como está hoje, com a heroImage.
ALTER TABLE "Boat" ADD COLUMN "heroVideo" TEXT;
