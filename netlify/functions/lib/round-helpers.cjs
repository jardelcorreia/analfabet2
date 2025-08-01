const determineDefaultRound = (allMatches, today = new Date()) => {
  const roundsData = {};
  
  // Organizar dados das rodadas
  allMatches.forEach(match => {
    if (!roundsData[match.round]) {
      roundsData[match.round] = {
        games: [],
        allFinished: true,
        startDate: new Date(match.match_date)
      };
    }
    roundsData[match.round].games.push(match);
    if (new Date(match.match_date) < roundsData[match.round].startDate) {
      roundsData[match.round].startDate = new Date(match.match_date);
    }
    if (match.status !== 'finished') {
      roundsData[match.round].allFinished = false;
    }
  });

  const roundNumbers = Object.keys(roundsData).map(Number).sort((a, b) => a - b);
  if (roundNumbers.length === 0) return 1;

  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Prioridade: Verificar se alguma rodada começa hoje ou amanhã
  for (const roundNum of roundNumbers) {
    const round = roundsData[roundNum];
    if (round.allFinished) continue;

    const roundStartDate = new Date(round.startDate);
    roundStartDate.setHours(0, 0, 0, 0);

    // Se a rodada começa hoje ou amanhã, seleciona-a
    if (
      roundStartDate.getTime() === today.getTime() || 
      roundStartDate.getTime() === tomorrow.getTime()
    ) {
      return roundNum;
    }
  }

  // 2. Se não há rodada começando em breve, encontrar a última rodada completamente finalizada
  let lastFinishedRound = null;
  for (const roundNum of roundNumbers) {
    if (roundsData[roundNum].allFinished) {
      lastFinishedRound = roundNum;
    }
  }

  if (lastFinishedRound) {
    // 3. Verificar se a próxima rodada (após a última finalizada) já começou
    const nextRoundNumber = lastFinishedRound + 1;
    const nextRound = roundsData[nextRoundNumber];
    
    if (nextRound && !nextRound.allFinished) {
      const nextRoundStartDate = new Date(nextRound.startDate);
      const now = new Date(); // Hora atual completa para comparação precisa
      
      // Se a próxima rodada já começou, mostrar ela
      if (nextRoundStartDate <= now) {
        return nextRoundNumber;
      } else {
        // Se a próxima rodada ainda não começou, mostrar a última finalizada
        return lastFinishedRound;
      }
    } else {
      // Se não há próxima rodada ou ela está finalizada, mostrar a última finalizada
      return lastFinishedRound;
    }
  }

  // 4. Fallback: Se nenhuma rodada foi finalizada ainda, mostrar a primeira rodada
  return roundNumbers.length > 0 ? roundNumbers[0] : 1;
};

module.exports = { determineDefaultRound };
