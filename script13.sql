SELECT wallet_address, MAX(score) as best_score, MAX(wave) as best_wave
FROM game_scores
WHERE created_at >= CURRENT_DATE
GROUP BY wallet_address
ORDER BY best_score DESC
LIMIT 10;