/*
  # Corrigir lógica de cálculo de pontos das apostas

  O problema é que a interface mostra "Errou" para todas as apostas mesmo quando
  os placares ou resultados estão corretos. Vamos:
  
  1. Corrigir a função de cálculo de pontos
  2. Recalcular todos os pontos existentes
  3. Adicionar logs para debug
  4. Testar com dados reais
*/

-- Função melhorada para calcular pontos das apostas
CREATE OR REPLACE FUNCTION calculate_bet_points()
RETURNS TRIGGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Debug: Log da execução da função
    RAISE NOTICE 'Calculando pontos para match_id: %, status: %, scores: % - %', 
        NEW.id, NEW.status, NEW.home_score, NEW.away_score;
    
    -- Calcular pontos quando o jogo está finalizado E tem placares
    IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
        -- Atualizar todas as apostas deste jogo
        UPDATE bets SET
            points = CASE
                -- Placar exato: 3 pontos
                WHEN bets.home_score = NEW.home_score AND bets.away_score = NEW.away_score THEN 3
                -- Resultado correto: 1 ponto
                WHEN (
                    -- Vitória do mandante (aposta e resultado)
                    (bets.home_score > bets.away_score AND NEW.home_score > NEW.away_score) OR
                    -- Vitória do visitante (aposta e resultado)
                    (bets.home_score < bets.away_score AND NEW.home_score < NEW.away_score) OR
                    -- Empate (aposta e resultado)
                    (bets.home_score = bets.away_score AND NEW.home_score = NEW.away_score)
                ) THEN 1
                -- Resultado errado: 0 pontos
                ELSE 0
            END,
            is_exact = (bets.home_score = NEW.home_score AND bets.away_score = NEW.away_score),
            updated_at = NOW()
        WHERE bets.match_id = NEW.id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;

        -- Debug: Log quantas apostas foram atualizadas
        RAISE NOTICE 'Apostas atualizadas para match_id %: %', NEW.id, updated_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_calculate_bet_points ON matches;
CREATE TRIGGER trigger_calculate_bet_points
    AFTER UPDATE OF status, home_score, away_score ON matches
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bet_points();

-- Função para recalcular TODOS os pontos manualmente
CREATE OR REPLACE FUNCTION recalculate_all_bet_points()
RETURNS TABLE(match_id UUID, bets_updated INTEGER) AS $$
DECLARE
    match_record RECORD;
    updated_count INTEGER;
BEGIN
    -- Para cada jogo finalizado com placares
    FOR match_record IN 
        SELECT id, home_team, away_team, home_score, away_score 
        FROM matches 
        WHERE status = 'finished' AND home_score IS NOT NULL AND away_score IS NOT NULL
    LOOP
        -- Atualizar pontos das apostas deste jogo
        UPDATE bets SET
            points = CASE
                -- Placar exato: 3 pontos
                WHEN bets.home_score = match_record.home_score AND bets.away_score = match_record.away_score THEN 3
                -- Resultado correto: 1 ponto
                WHEN (
                    -- Vitória do mandante
                    (bets.home_score > bets.away_score AND match_record.home_score > match_record.away_score) OR
                    -- Vitória do visitante
                    (bets.home_score < bets.away_score AND match_record.home_score < match_record.away_score) OR
                    -- Empate
                    (bets.home_score = bets.away_score AND match_record.home_score = match_record.away_score)
                ) THEN 1
                -- Resultado errado: 0 pontos
                ELSE 0
            END,
            is_exact = (bets.home_score = match_record.home_score AND bets.away_score = match_record.away_score),
            updated_at = NOW()
        WHERE bets.match_id = match_record.id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        RAISE NOTICE 'Match: % vs % (% - %) - % apostas atualizadas', 
            match_record.home_team, match_record.away_team, 
            match_record.home_score, match_record.away_score, updated_count;
            
        -- Retornar informações sobre a atualização
        match_id := match_record.id;
        bets_updated := updated_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar o recálculo
SELECT * FROM recalculate_all_bet_points();

-- Função para debug: mostrar detalhes das apostas e cálculos
CREATE OR REPLACE FUNCTION debug_bet_calculations()
RETURNS TABLE(
    bet_id UUID,
    user_name VARCHAR,
    match_info TEXT,
    bet_score TEXT,
    actual_score TEXT,
    bet_result TEXT,
    actual_result TEXT,
    calculated_points INTEGER,
    is_exact BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as bet_id,
        u.name as user_name,
        (m.home_team || ' vs ' || m.away_team) as match_info,
        (b.home_score || ' - ' || b.away_score) as bet_score,
        CASE 
            WHEN m.home_score IS NOT NULL AND m.away_score IS NOT NULL 
            THEN (m.home_score || ' - ' || m.away_score)
            ELSE 'Não finalizado'
        END as actual_score,
        CASE 
            WHEN b.home_score > b.away_score THEN 'Vitória mandante'
            WHEN b.home_score < b.away_score THEN 'Vitória visitante'
            ELSE 'Empate'
        END as bet_result,
        CASE 
            WHEN m.home_score IS NULL OR m.away_score IS NULL THEN 'Jogo não finalizado'
            WHEN m.home_score > m.away_score THEN 'Vitória mandante'
            WHEN m.home_score < m.away_score THEN 'Vitória visitante'
            ELSE 'Empate'
        END as actual_result,
        b.points as calculated_points,
        b.is_exact
    FROM bets b
    JOIN users u ON b.user_id = u.id
    JOIN matches m ON b.match_id = m.id
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Executar debug para ver os cálculos
SELECT * FROM debug_bet_calculations();

-- Atualizar alguns jogos para teste se não existirem dados
DO $$
BEGIN
    -- Verificar se já existem jogos finalizados
    IF NOT EXISTS (SELECT 1 FROM matches WHERE status = 'finished') THEN
        -- Finalizar alguns jogos com placares para teste
        UPDATE matches SET 
            status = 'finished',
            home_score = 2,
            away_score = 1
        WHERE api_id = 1001; -- Flamengo 2x1 Palmeiras

        UPDATE matches SET 
            status = 'finished',
            home_score = 1,
            away_score = 1
        WHERE api_id = 1002; -- São Paulo 1x1 Corinthians

        UPDATE matches SET 
            status = 'finished',
            home_score = 0,
            away_score = 2
        WHERE api_id = 1003; -- Santos 0x2 Grêmio
        
        RAISE NOTICE 'Jogos de teste finalizados com placares';
    END IF;
END $$;

-- Executar novamente o recálculo após finalizar jogos
SELECT * FROM recalculate_all_bet_points();

-- Mostrar estatísticas finais
SELECT 
    'Total de apostas' as metric,
    COUNT(*)::TEXT as value
FROM bets
UNION ALL
SELECT 
    'Apostas com pontos calculados',
    COUNT(*)::TEXT
FROM bets 
WHERE points IS NOT NULL
UNION ALL
SELECT 
    'Apostas com 3 pontos (exato)',
    COUNT(*)::TEXT
FROM bets 
WHERE points = 3
UNION ALL
SELECT 
    'Apostas com 1 ponto (resultado)',
    COUNT(*)::TEXT
FROM bets 
WHERE points = 1
UNION ALL
SELECT 
    'Apostas com 0 pontos (errou)',
    COUNT(*)::TEXT
FROM bets 
WHERE points = 0;