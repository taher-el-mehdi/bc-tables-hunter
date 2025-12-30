export interface ScoreState {
  matchedCount: number;
  totalTables: number;
}

export class ScoreService {
  private state: ScoreState;

  constructor() {
    this.state = {
      matchedCount: 0,
      totalTables: 0
    };
  }

  public setTotalTables(total: number) {
    this.state.totalTables = total;
  }

  public validateMatch(tableId: number, selectedId: number): boolean {
    const isCorrect = tableId === selectedId;
    if (isCorrect) {
      this.state.matchedCount++;
    }
    return isCorrect;
  }

  public getMatchedCount(): number {
    return this.state.matchedCount;
  }

  public getRemainingCount(): number {
    return this.state.totalTables - this.state.matchedCount;
  }

  public reset() {
    this.state = {
      matchedCount: 0,
      totalTables: this.state.totalTables
    };
  }
}
