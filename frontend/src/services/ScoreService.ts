export class ScoreService {
  private score = 0;
  private matches = 0;
  private wrong = 0;

  public addPoints(points: number) {
    this.score += points;
  }

  public addMatch() {
    this.matches += 1;
  }

  public addWrong() {
    this.wrong += 1;
  }

  public getState() {
    return {
      score: this.score,
      matches: this.matches,
      wrong: this.wrong,
    };
  }

  public reset() {
    this.score = 0;
    this.matches = 0;
    this.wrong = 0;
  }
}
