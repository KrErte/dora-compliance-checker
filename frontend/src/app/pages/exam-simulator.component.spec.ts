import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ExamSimulatorComponent } from './exam-simulator.component';
import { LangService } from '../lang.service';

describe('ExamSimulatorComponent', () => {
  let component: ExamSimulatorComponent;
  let fixture: ComponentFixture<ExamSimulatorComponent>;
  let httpMock: HttpTestingController;
  let lang: LangService;

  // --- Mock data factories ---

  function mockExamSession() {
    return {
      sessionId: 'sess-abc-123',
      totalQuestions: 3,
      questions: [
        { index: 0, question: 'Describe your ICT risk framework.', category: 'ICT Risk Management', articleReference: 'Art. 5-6', points: 10, difficulty: 'intermediate' },
        { index: 1, question: 'How do you handle incident reporting?', category: 'Incident Management', articleReference: 'Art. 17-19', points: 10, difficulty: 'intermediate' },
        { index: 2, question: 'Explain your resilience testing approach.', category: 'Resilience Testing', articleReference: 'Art. 24-25', points: 10, difficulty: 'intermediate' }
      ]
    };
  }

  function mockAnswerFeedback(score = 8, maxPoints = 10) {
    return {
      score,
      maxPoints,
      feedback: 'Good understanding of the regulatory framework.',
      strengths: ['Clear articulation of risk processes', 'References to relevant articles'],
      gaps: ['Missing detail on third-party oversight'],
      recommendation: 'Include more detail on outsourcing governance.'
    };
  }

  function mockExamResult() {
    return {
      grade: 'B',
      verdict: 'Good — meets most regulatory expectations',
      totalPoints: 30,
      earnedPoints: 24,
      percentage: 80,
      categoryScores: [
        { category: 'ICT Risk Management', earned: 8, total: 10, percentage: 80 },
        { category: 'Incident Management', earned: 9, total: 10, percentage: 90 },
        { category: 'Resilience Testing', earned: 7, total: 10, percentage: 70 }
      ]
    };
  }

  function mockHistoryEntries() {
    return [
      { sessionId: 'sess-001', focus: 'all', difficulty: 'intermediate', grade: 'B', percentage: 78, completedAt: '2026-03-01T10:00:00Z', totalQuestions: 5 },
      { sessionId: 'sess-002', focus: 'ict_risk', difficulty: 'advanced', grade: 'A', percentage: 92, completedAt: '2026-03-02T14:30:00Z', totalQuestions: 5 }
    ];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamSimulatorComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamSimulatorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    lang = TestBed.inject(LangService);

    // ngOnInit calls loadHistory — flush that initial request
    fixture.detectChanges();
    const historyReq = httpMock.expectOne('/api/exam-simulator/history');
    historyReq.flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===== Component Creation =====

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial screen state as "setup"', () => {
    expect(component.screen()).toBe('setup');
  });

  // ===== Setup Screen — Defaults =====

  it('should default selectedFocus to "all"', () => {
    expect(component.selectedFocus()).toBe('all');
  });

  it('should default selectedDifficulty to "intermediate"', () => {
    expect(component.selectedDifficulty()).toBe('intermediate');
  });

  it('should allow changing focus', () => {
    component.selectedFocus.set('ict_risk');
    expect(component.selectedFocus()).toBe('ict_risk');

    component.selectedFocus.set('incident');
    expect(component.selectedFocus()).toBe('incident');

    component.selectedFocus.set('third_party');
    expect(component.selectedFocus()).toBe('third_party');
  });

  it('should allow changing difficulty', () => {
    component.selectedDifficulty.set('basic');
    expect(component.selectedDifficulty()).toBe('basic');

    component.selectedDifficulty.set('advanced');
    expect(component.selectedDifficulty()).toBe('advanced');
  });

  it('should have 6 focus options defined', () => {
    expect(component.focusOptions.length).toBe(6);
    expect(component.focusOptions.map(f => f.value)).toEqual([
      'all', 'ict_risk', 'incident', 'resilience', 'third_party', 'info_sharing'
    ]);
  });

  it('should have 3 difficulty options defined', () => {
    expect(component.difficultyOptions.length).toBe(3);
    expect(component.difficultyOptions.map(d => d.value)).toEqual(['basic', 'intermediate', 'advanced']);
  });

  // ===== Starting Exam =====

  it('should call POST /api/exam-simulator/start when startExam() is invoked', fakeAsync(() => {
    component.startExam();

    const req = httpMock.expectOne('/api/exam-simulator/start');
    expect(req.request.method).toBe('POST');
    req.flush(mockExamSession());
    tick();
  }));

  it('should send focus and difficulty in the start request body', fakeAsync(() => {
    component.selectedFocus.set('ict_risk');
    component.selectedDifficulty.set('advanced');
    component.startExam();

    const req = httpMock.expectOne('/api/exam-simulator/start');
    expect(req.request.body).toEqual({ focus: 'ict_risk', difficulty: 'advanced' });
    req.flush(mockExamSession());
    tick();
  }));

  it('should transition to exam screen on successful start', fakeAsync(() => {
    component.startExam();

    const req = httpMock.expectOne('/api/exam-simulator/start');
    req.flush(mockExamSession());
    tick();

    expect(component.screen()).toBe('exam');
    expect(component.session()).toBeTruthy();
    expect(component.session()!.sessionId).toBe('sess-abc-123');
  }));

  it('should populate questions on successful start', fakeAsync(() => {
    component.startExam();

    const req = httpMock.expectOne('/api/exam-simulator/start');
    req.flush(mockExamSession());
    tick();

    expect(component.session()!.questions.length).toBe(3);
    expect(component.totalQuestions()).toBe(3);
    expect(component.currentQuestionIndex()).toBe(0);
  }));

  it('should set starting flag during request and clear it after', fakeAsync(() => {
    component.startExam();
    expect(component.starting()).toBeTrue();

    const req = httpMock.expectOne('/api/exam-simulator/start');
    req.flush(mockExamSession());
    tick();

    expect(component.starting()).toBeFalse();
  }));

  it('should display the current question via computed signal', fakeAsync(() => {
    component.startExam();
    const req = httpMock.expectOne('/api/exam-simulator/start');
    req.flush(mockExamSession());
    tick();

    const q = component.currentQuestion();
    expect(q).toBeTruthy();
    expect(q!.question).toBe('Describe your ICT risk framework.');
    expect(q!.category).toBe('ICT Risk Management');
  }));

  // ===== Answering Questions =====

  function startExamAndFlush(): void {
    component.startExam();
    const req = httpMock.expectOne('/api/exam-simulator/start');
    req.flush(mockExamSession());
  }

  it('should call POST /api/exam-simulator/answer when submitAnswer() is invoked', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = 'We have a comprehensive ICT risk management framework.';
    component.submitAnswer();

    const req = httpMock.expectOne('/api/exam-simulator/answer');
    expect(req.request.method).toBe('POST');
    req.flush(mockAnswerFeedback());
    tick();
  }));

  it('should send sessionId, questionIndex, and answer in the answer request body', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = 'Our incident response plan includes...';
    component.submitAnswer();

    const req = httpMock.expectOne('/api/exam-simulator/answer');
    expect(req.request.body).toEqual({
      sessionId: 'sess-abc-123',
      questionIndex: 0,
      answer: 'Our incident response plan includes...'
    });
    req.flush(mockAnswerFeedback());
    tick();
  }));

  it('should display feedback after successful answer submission', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = 'Detailed answer here.';
    component.submitAnswer();

    const req = httpMock.expectOne('/api/exam-simulator/answer');
    const feedback = mockAnswerFeedback();
    req.flush(feedback);
    tick();

    expect(component.currentFeedback()).toBeTruthy();
    expect(component.currentFeedback()!.score).toBe(8);
    expect(component.currentFeedback()!.maxPoints).toBe(10);
    expect(component.currentFeedback()!.feedback).toBe('Good understanding of the regulatory framework.');
    expect(component.currentFeedback()!.strengths.length).toBe(2);
    expect(component.currentFeedback()!.gaps.length).toBe(1);
    expect(component.screen()).toBe('feedback');
  }));

  it('should track earned points via feedbackScores after answer', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = 'Answer text.';
    component.submitAnswer();

    const req = httpMock.expectOne('/api/exam-simulator/answer');
    req.flush(mockAnswerFeedback(7, 10));
    tick();

    expect(component.earnedPoints()).toBe(7);
    expect(component.maxPossiblePoints()).toBe(10);
    expect(component.feedbackScores().length).toBe(1);
  }));

  it('should set submitting flag during answer request and clear it after', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = 'Answer.';
    component.submitAnswer();
    expect(component.submitting()).toBeTrue();

    const req = httpMock.expectOne('/api/exam-simulator/answer');
    req.flush(mockAnswerFeedback());
    tick();

    expect(component.submitting()).toBeFalse();
  }));

  it('should not submit when answer is empty', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = '';
    component.submitAnswer();

    httpMock.expectNone('/api/exam-simulator/answer');
    expect(component.submitting()).toBeFalse();
  }));

  it('should not submit when answer is only whitespace', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = '   ';
    component.submitAnswer();

    httpMock.expectNone('/api/exam-simulator/answer');
    expect(component.submitting()).toBeFalse();
  }));

  it('should move to next question after answering', fakeAsync(() => {
    startExamAndFlush();
    tick();

    // Answer question 0
    component.currentAnswer = 'Answer for Q1.';
    component.submitAnswer();
    const req = httpMock.expectOne('/api/exam-simulator/answer');
    req.flush(mockAnswerFeedback());
    tick();

    expect(component.screen()).toBe('feedback');

    // Move to next
    component.nextQuestion();

    expect(component.currentQuestionIndex()).toBe(1);
    expect(component.screen()).toBe('exam');
    expect(component.currentAnswer).toBe('');
    expect(component.currentFeedback()).toBeNull();
    expect(component.currentQuestion()!.question).toBe('How do you handle incident reporting?');
  }));

  it('should accumulate points across multiple answers', fakeAsync(() => {
    startExamAndFlush();
    tick();

    // Answer Q0
    component.currentAnswer = 'Answer Q0';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback(8, 10));
    tick();

    component.nextQuestion();

    // Answer Q1
    component.currentAnswer = 'Answer Q1';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback(6, 10));
    tick();

    expect(component.earnedPoints()).toBe(14);
    expect(component.maxPossiblePoints()).toBe(20);
    expect(component.feedbackScores().length).toBe(2);
  }));

  // ===== Progress Computed Signals =====

  it('should compute progressPercent correctly', fakeAsync(() => {
    startExamAndFlush();
    tick();

    // At question 0 of 3 => 0%
    expect(component.progressPercent()).toBe(0);

    // Answer Q0 and move to Q1
    component.currentAnswer = 'A';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback());
    tick();
    component.nextQuestion();

    // At question 1 of 3 => ~33.3%
    expect(component.progressPercent()).toBeCloseTo(33.33, 1);
  }));

  it('should correctly identify the last question', fakeAsync(() => {
    startExamAndFlush();
    tick();

    expect(component.isLastQuestion()).toBeFalse(); // index 0, total 3

    component.currentQuestionIndex.set(2);
    expect(component.isLastQuestion()).toBeTrue(); // index 2, total 3
  }));

  // ===== Completing Exam =====

  it('should call POST /api/exam-simulator/complete when last question is answered and nextQuestion called', fakeAsync(() => {
    startExamAndFlush();
    tick();

    // Navigate to last question
    component.currentQuestionIndex.set(2);

    // Answer last question
    component.currentAnswer = 'Final answer.';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback());
    tick();

    // Click next (which calls completeExam since it's the last)
    component.nextQuestion();

    const completeReq = httpMock.expectOne('/api/exam-simulator/complete');
    expect(completeReq.request.method).toBe('POST');
    expect(completeReq.request.body).toEqual({ sessionId: 'sess-abc-123' });
    completeReq.flush(mockExamResult());

    // completeExam also calls loadHistory
    const histReq = httpMock.expectOne('/api/exam-simulator/history');
    histReq.flush(mockHistoryEntries());
    tick();
  }));

  it('should display results screen with grade and percentage after completing', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentQuestionIndex.set(2);
    component.currentAnswer = 'Final answer.';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback());
    tick();

    component.nextQuestion();

    httpMock.expectOne('/api/exam-simulator/complete').flush(mockExamResult());
    httpMock.expectOne('/api/exam-simulator/history').flush([]);
    tick();

    expect(component.screen()).toBe('results');
    expect(component.examResult()).toBeTruthy();
    expect(component.examResult()!.grade).toBe('B');
    expect(component.examResult()!.percentage).toBe(80);
    expect(component.examResult()!.earnedPoints).toBe(24);
    expect(component.examResult()!.totalPoints).toBe(30);
    expect(component.examResult()!.verdict).toBe('Good — meets most regulatory expectations');
  }));

  it('should display category scores in results', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentQuestionIndex.set(2);
    component.currentAnswer = 'Answer.';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback());
    tick();

    component.nextQuestion();

    httpMock.expectOne('/api/exam-simulator/complete').flush(mockExamResult());
    httpMock.expectOne('/api/exam-simulator/history').flush([]);
    tick();

    const categories = component.examResult()!.categoryScores;
    expect(categories.length).toBe(3);
    expect(categories[0].category).toBe('ICT Risk Management');
    expect(categories[0].percentage).toBe(80);
    expect(categories[1].category).toBe('Incident Management');
    expect(categories[1].percentage).toBe(90);
    expect(categories[2].category).toBe('Resilience Testing');
    expect(categories[2].percentage).toBe(70);
  }));

  // ===== History =====

  it('should call GET /api/exam-simulator/history when loadHistory() is invoked', fakeAsync(() => {
    component.loadHistory();

    const req = httpMock.expectOne('/api/exam-simulator/history');
    expect(req.request.method).toBe('GET');
    req.flush(mockHistoryEntries());
    tick();
  }));

  it('should populate history entries on successful load', fakeAsync(() => {
    component.loadHistory();

    const req = httpMock.expectOne('/api/exam-simulator/history');
    req.flush(mockHistoryEntries());
    tick();

    expect(component.history().length).toBe(2);
    expect(component.history()[0].sessionId).toBe('sess-001');
    expect(component.history()[0].grade).toBe('B');
    expect(component.history()[0].percentage).toBe(78);
    expect(component.history()[1].sessionId).toBe('sess-002');
    expect(component.history()[1].grade).toBe('A');
  }));

  it('should set historyLoading flag during history request', fakeAsync(() => {
    component.loadHistory();
    expect(component.historyLoading()).toBeTrue();

    const req = httpMock.expectOne('/api/exam-simulator/history');
    req.flush([]);
    tick();

    expect(component.historyLoading()).toBeFalse();
  }));

  it('should switch to history screen when screen is set to history', () => {
    component.screen.set('history');
    expect(component.screen()).toBe('history');
  });

  it('should handle empty history gracefully', fakeAsync(() => {
    component.loadHistory();

    const req = httpMock.expectOne('/api/exam-simulator/history');
    req.flush([]);
    tick();

    expect(component.history().length).toBe(0);
  }));

  it('should handle null history response gracefully', fakeAsync(() => {
    component.loadHistory();

    const req = httpMock.expectOne('/api/exam-simulator/history');
    req.flush(null);
    tick();

    expect(component.history().length).toBe(0);
  }));

  // ===== Error Handling =====

  it('should set error and not crash when startExam fails', fakeAsync(() => {
    component.startExam();

    const req = httpMock.expectOne('/api/exam-simulator/start');
    req.flush({ message: 'Service unavailable' }, { status: 503, statusText: 'Service Unavailable' });
    tick();

    expect(component.error()).toBeTruthy();
    expect(component.starting()).toBeFalse();
    expect(component.screen()).toBe('setup'); // stays on setup
  }));

  it('should set fallback error message when start error has no message', fakeAsync(() => {
    component.startExam();

    const req = httpMock.expectOne('/api/exam-simulator/start');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    tick();

    expect(component.error()).toBe('Failed to start examination. Please try again.');
    expect(component.starting()).toBeFalse();
  }));

  it('should set error and not crash when submitAnswer fails', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = 'My answer text.';
    component.submitAnswer();

    const req = httpMock.expectOne('/api/exam-simulator/answer');
    req.flush({ message: 'AI evaluation failed' }, { status: 500, statusText: 'Internal Server Error' });
    tick();

    expect(component.error()).toBeTruthy();
    expect(component.submitting()).toBeFalse();
    // Screen should not have changed to feedback
    expect(component.screen()).toBe('exam');
  }));

  it('should set fallback error message when answer error has no message', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentAnswer = 'Some answer.';
    component.submitAnswer();

    const req = httpMock.expectOne('/api/exam-simulator/answer');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    tick();

    expect(component.error()).toBe('Failed to evaluate answer. Please try again.');
  }));

  it('should set error when completeExam fails', fakeAsync(() => {
    startExamAndFlush();
    tick();

    component.currentQuestionIndex.set(2);
    component.currentAnswer = 'Final.';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback());
    tick();

    component.nextQuestion();

    const completeReq = httpMock.expectOne('/api/exam-simulator/complete');
    completeReq.flush({ message: 'Completion failed' }, { status: 500, statusText: 'Internal Server Error' });
    tick();

    expect(component.error()).toBeTruthy();
    expect(component.completing()).toBeFalse();
  }));

  it('should handle history load error gracefully without crashing', fakeAsync(() => {
    component.loadHistory();

    const req = httpMock.expectOne('/api/exam-simulator/history');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    tick();

    expect(component.history().length).toBe(0);
    expect(component.historyLoading()).toBeFalse();
  }));

  // ===== Reset Exam =====

  it('should reset all state when resetExam() is called', fakeAsync(() => {
    // Start and complete an exam flow partially
    startExamAndFlush();
    tick();

    component.currentAnswer = 'Some answer';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback());
    tick();

    // Now reset
    component.resetExam();

    expect(component.screen()).toBe('setup');
    expect(component.session()).toBeNull();
    expect(component.currentQuestionIndex()).toBe(0);
    expect(component.currentAnswer).toBe('');
    expect(component.currentFeedback()).toBeNull();
    expect(component.feedbackScores().length).toBe(0);
    expect(component.examResult()).toBeNull();
    expect(component.error()).toBeNull();
  }));

  // ===== UI Helper Methods =====

  it('should return correct question dot class based on score percentage', () => {
    // No feedback recorded for index 5 => default class
    const defaultClass = component.getQuestionDotClass(5);
    expect(defaultClass).toContain('slate');

    // Set a high score for index 0
    component.feedbackScores.set([{ index: 0, score: 9, max: 10 }]);
    expect(component.getQuestionDotClass(0)).toContain('blue');

    // Medium score
    component.feedbackScores.set([{ index: 0, score: 5, max: 10 }]);
    expect(component.getQuestionDotClass(0)).toContain('amber');

    // Low score
    component.feedbackScores.set([{ index: 0, score: 2, max: 10 }]);
    expect(component.getQuestionDotClass(0)).toContain('red');
  });

  it('should return correct feedback banner class based on score', () => {
    expect(component.getFeedbackBannerClass(9, 10)).toContain('blue');
    expect(component.getFeedbackBannerClass(5, 10)).toContain('amber');
    expect(component.getFeedbackBannerClass(2, 10)).toContain('red');
  });

  it('should return correct score label based on score percentage', () => {
    expect(component.getScoreLabel(10, 10)).toBe('Excellent Response');
    expect(component.getScoreLabel(8, 10)).toBe('Good Response');
    expect(component.getScoreLabel(6, 10)).toBe('Adequate Response');
    expect(component.getScoreLabel(4, 10)).toBe('Partial Response');
    expect(component.getScoreLabel(1, 10)).toBe('Insufficient Response');
  });

  it('should return correct grade text class for each grade', () => {
    expect(component.getGradeTextClass('A')).toContain('blue');
    expect(component.getGradeTextClass('B')).toContain('teal');
    expect(component.getGradeTextClass('C')).toContain('amber');
    expect(component.getGradeTextClass('D')).toContain('orange');
    expect(component.getGradeTextClass('F')).toContain('red');
  });

  it('should return correct grade border class for each grade', () => {
    expect(component.getGradeBorderClass('A')).toContain('blue');
    expect(component.getGradeBorderClass('B')).toContain('teal');
    expect(component.getGradeBorderClass('C')).toContain('amber');
    expect(component.getGradeBorderClass('D')).toContain('orange');
    expect(component.getGradeBorderClass('F')).toContain('red');
  });

  it('should return correct verdict class for each grade', () => {
    expect(component.getVerdictClass('A')).toContain('blue');
    expect(component.getVerdictClass('B')).toContain('teal');
    expect(component.getVerdictClass('C')).toContain('amber');
    expect(component.getVerdictClass('D')).toContain('orange');
    expect(component.getVerdictClass('F')).toContain('red');
  });

  it('should return correct category score color based on percentage', () => {
    expect(component.getCategoryScoreColor(85)).toContain('blue');
    expect(component.getCategoryScoreColor(55)).toContain('amber');
    expect(component.getCategoryScoreColor(20)).toContain('red');
  });

  it('should return correct category bar class based on percentage', () => {
    expect(component.getCategoryBarClass(75)).toContain('blue');
    expect(component.getCategoryBarClass(50)).toContain('amber');
    expect(component.getCategoryBarClass(30)).toContain('red');
  });

  it('should return correct grade gradient class', () => {
    expect(component.getGradeGradientClass('A')).toContain('blue');
    expect(component.getGradeGradientClass('B')).toContain('blue');
    expect(component.getGradeGradientClass('C')).toContain('amber');
    expect(component.getGradeGradientClass('D')).toContain('orange');
    expect(component.getGradeGradientClass('F')).toContain('red');
  });

  it('should return focus label key from focusOptions', () => {
    expect(component.getFocusLabelKey('all')).toContain('exam.focus');
    expect(component.getFocusLabelKey('ict_risk')).toContain('exam.focus');
    expect(component.getFocusLabelKey('incident')).toContain('exam.focus');
    expect(component.getFocusLabelKey('resilience')).toContain('exam.focus');
    expect(component.getFocusLabelKey('third_party')).toContain('exam.focus');
    expect(component.getFocusLabelKey('info_sharing')).toContain('exam.focus');
  });

  it('should return fallback key when focus not found in focusOptions', () => {
    expect(component.getFocusLabelKey('unknown_focus')).toBe('exam.focus_all');
  });

  it('should return correct feedback score background class', () => {
    expect(component.getFeedbackScoreBg(9, 10)).toContain('blue');
    expect(component.getFeedbackScoreBg(5, 10)).toContain('amber');
    expect(component.getFeedbackScoreBg(2, 10)).toContain('red');
  });

  it('should return correct feedback score color class', () => {
    expect(component.getFeedbackScoreColor(9, 10)).toContain('blue');
    expect(component.getFeedbackScoreColor(5, 10)).toContain('amber');
    expect(component.getFeedbackScoreColor(2, 10)).toContain('red');
  });

  // ===== Full Exam Flow — Integration =====

  it('should support a complete exam flow: setup -> exam -> feedback -> results', fakeAsync(() => {
    // 1. Setup
    expect(component.screen()).toBe('setup');
    component.selectedFocus.set('ict_risk');
    component.selectedDifficulty.set('advanced');

    // 2. Start exam
    component.startExam();
    const startReq = httpMock.expectOne('/api/exam-simulator/start');
    expect(startReq.request.body).toEqual({ focus: 'ict_risk', difficulty: 'advanced' });
    startReq.flush(mockExamSession());
    tick();
    expect(component.screen()).toBe('exam');

    // 3. Answer Q0
    component.currentAnswer = 'Answer for question 1.';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback(8, 10));
    tick();
    expect(component.screen()).toBe('feedback');
    component.nextQuestion();
    expect(component.screen()).toBe('exam');
    expect(component.currentQuestionIndex()).toBe(1);

    // 4. Answer Q1
    component.currentAnswer = 'Answer for question 2.';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback(9, 10));
    tick();
    expect(component.screen()).toBe('feedback');
    component.nextQuestion();
    expect(component.screen()).toBe('exam');
    expect(component.currentQuestionIndex()).toBe(2);

    // 5. Answer Q2 (last)
    component.currentAnswer = 'Answer for question 3.';
    component.submitAnswer();
    httpMock.expectOne('/api/exam-simulator/answer').flush(mockAnswerFeedback(7, 10));
    tick();
    expect(component.screen()).toBe('feedback');
    expect(component.isLastQuestion()).toBeTrue();

    // 6. Complete
    component.nextQuestion();
    httpMock.expectOne('/api/exam-simulator/complete').flush(mockExamResult());
    httpMock.expectOne('/api/exam-simulator/history').flush(mockHistoryEntries());
    tick();

    // 7. Results
    expect(component.screen()).toBe('results');
    expect(component.examResult()!.grade).toBe('B');
    expect(component.examResult()!.percentage).toBe(80);
    expect(component.earnedPoints()).toBe(24); // 8 + 9 + 7
    expect(component.history().length).toBe(2);
  }));
});
