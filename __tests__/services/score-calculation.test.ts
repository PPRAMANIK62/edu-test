import { describe, it, expect } from "vitest";

// Reimplementation of the private calculateScore function from lib/services/attempts.ts (lines 404-431)
// Answer tuple format: [questionIndex, selectedIndex, isMarkedForReview]
type Answer = [number, number, boolean];
interface Question {
  correctIndex: number;
}

function calculateScore(
  answers: Answer[],
  questions: Question[],
): { score: number; percentage: number } {
  if (questions.length === 0) {
    return { score: 0, percentage: 0 };
  }

  let correctCount = 0;

  for (const answer of answers) {
    const [questionIndex, selectedIndex] = answer;
    const question = questions[questionIndex];

    if (question && question.correctIndex === selectedIndex) {
      correctCount++;
    }
  }

  const percentage = Math.round((correctCount / questions.length) * 100);

  return {
    score: correctCount,
    percentage,
  };
}

describe("calculateScore", () => {
  it("returns 0 for empty questions", () => {
    const result = calculateScore([], []);
    expect(result).toEqual({ score: 0, percentage: 0 });
  });

  it("returns 100% for all correct answers", () => {
    const questions: Question[] = [
      { correctIndex: 0 },
      { correctIndex: 2 },
      { correctIndex: 1 },
    ];
    const answers: Answer[] = [
      [0, 0, false],
      [1, 2, false],
      [2, 1, false],
    ];
    const result = calculateScore(answers, questions);
    expect(result).toEqual({ score: 3, percentage: 100 });
  });

  it("returns 0% for all wrong answers", () => {
    const questions: Question[] = [
      { correctIndex: 0 },
      { correctIndex: 2 },
      { correctIndex: 1 },
    ];
    const answers: Answer[] = [
      [0, 1, false],
      [1, 0, false],
      [2, 3, false],
    ];
    const result = calculateScore(answers, questions);
    expect(result).toEqual({ score: 0, percentage: 0 });
  });

  it("handles partial correct answers", () => {
    const questions: Question[] = [
      { correctIndex: 0 },
      { correctIndex: 2 },
      { correctIndex: 1 },
      { correctIndex: 3 },
    ];
    const answers: Answer[] = [
      [0, 0, false], // correct
      [1, 1, false], // wrong
      [2, 1, true], // correct (marked for review but still correct)
      [3, 0, false], // wrong
    ];
    const result = calculateScore(answers, questions);
    expect(result).toEqual({ score: 2, percentage: 50 });
  });

  it("handles unanswered questions (no answer for that index)", () => {
    const questions: Question[] = [
      { correctIndex: 0 },
      { correctIndex: 2 },
      { correctIndex: 1 },
    ];
    // Only answered question 0
    const answers: Answer[] = [[0, 0, false]];
    const result = calculateScore(answers, questions);
    // 1 correct out of 3 questions = 33%
    expect(result).toEqual({ score: 1, percentage: 33 });
  });

  it("handles out-of-range question index gracefully", () => {
    const questions: Question[] = [{ correctIndex: 0 }, { correctIndex: 2 }];
    const answers: Answer[] = [
      [0, 0, false], // correct
      [5, 1, false], // out of range — questions[5] is undefined, skipped
    ];
    const result = calculateScore(answers, questions);
    expect(result).toEqual({ score: 1, percentage: 50 });
  });

  it("rounds percentage correctly", () => {
    const questions: Question[] = [
      { correctIndex: 0 },
      { correctIndex: 1 },
      { correctIndex: 2 },
    ];
    // 1 out of 3 = 33.333...% rounds to 33
    const answers: Answer[] = [[0, 0, false]];
    expect(calculateScore(answers, questions).percentage).toBe(33);

    // 2 out of 3 = 66.666...% rounds to 67
    const answers2: Answer[] = [
      [0, 0, false],
      [1, 1, false],
    ];
    expect(calculateScore(answers2, questions).percentage).toBe(67);
  });
});
