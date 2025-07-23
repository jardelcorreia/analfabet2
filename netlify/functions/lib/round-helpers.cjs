const determineDefaultRound = (allMatches, today = new Date()) => {
  const roundsData = {};

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

  let activeRounds = [];
  let futureIncompleteRounds = [];

  for (const roundNum of roundNumbers) {
    const round = roundsData[roundNum];
    const roundStartDate = new Date(round.startDate);
    roundStartDate.setHours(0, 0, 0, 0);

    if (roundStartDate <= today && !round.allFinished) {
      activeRounds.push(roundNum);
    } else if (roundStartDate > today && !round.allFinished) {
      futureIncompleteRounds.push(roundNum);
    }
  }

  let defaultRound;
  if (activeRounds.length > 0) {
    defaultRound = Math.max(...activeRounds);
  } else if (futureIncompleteRounds.length > 0) {
    defaultRound = Math.min(...futureIncompleteRounds);
  } else {
    defaultRound = Math.max(...roundNumbers);
  }

  const nextRoundNumber = defaultRound + 1;
  if (roundsData[nextRoundNumber]) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextRoundStartDate = new Date(roundsData[nextRoundNumber].startDate);
    nextRoundStartDate.setHours(0, 0, 0, 0);

    if (nextRoundStartDate.getTime() === tomorrow.getTime()) {
      return nextRoundNumber;
    }
  }

  // Look ahead for the next round that starts tomorrow
  for (const roundNum of roundNumbers) {
    if (roundNum > defaultRound) {
      const round = roundsData[roundNum];
      const roundStartDate = new Date(round.startDate);
      roundStartDate.setHours(0, 0, 0, 0);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (roundStartDate.getTime() === tomorrow.getTime()) {
        return roundNum;
      }
    }
  }

  return defaultRound;
};

module.exports = { determineDefaultRound };
