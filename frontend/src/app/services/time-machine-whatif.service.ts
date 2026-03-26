import { Injectable } from '@angular/core';

export interface WhatIfResult {
  scenarioId: string;
  name: string;
  nameEt: string;
  color: string;
  currentScore: number;
  endScore: number;
  trajectory: { date: string; score: number }[];
}

@Injectable({ providedIn: 'root' })
export class TimeMachineWhatifService {

  simulateScenario(scenarioId: string, currentScore: number): WhatIfResult | null {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const addWeeks = (base: Date, w: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + w * 7);
      return d;
    };

    switch (scenarioId) {
      case 'started_6m_ago': {
        const trajectory: { date: string; score: number }[] = [];
        const start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        for (let w = 0; w <= 26; w++) {
          const score = Math.min(100, currentScore * 0.3 + w * 2.8);
          trajectory.push({ date: fmt(addWeeks(start, w)), score: Math.round(score) });
        }
        return {
          scenarioId, name: 'Started 6 Months Ago', nameEt: 'Alustasime 6 kuud tagasi',
          color: '#10b981', currentScore: Math.round(currentScore),
          endScore: trajectory[trajectory.length - 1].score, trajectory
        };
      }
      case 'do_nothing_3m': {
        const trajectory: { date: string; score: number }[] = [];
        for (let w = 0; w <= 12; w++) {
          const score = Math.max(0, currentScore - w * 2.1);
          trajectory.push({ date: fmt(addWeeks(today, w)), score: Math.round(score) });
        }
        return {
          scenarioId, name: 'Do Nothing for 3 Months', nameEt: 'Ei tee midagi 3 kuud',
          color: '#ef4444', currentScore: Math.round(currentScore),
          endScore: trajectory[trajectory.length - 1].score, trajectory
        };
      }
      case 'double_pace': {
        const trajectory: { date: string; score: number }[] = [];
        for (let w = 0; w <= 24; w++) {
          const score = Math.min(100, currentScore + w * 3.5);
          trajectory.push({ date: fmt(addWeeks(today, w)), score: Math.round(score) });
        }
        return {
          scenarioId, name: 'Double Our Pace', nameEt: 'Kahekordistame tempot',
          color: '#8b5cf6', currentScore: Math.round(currentScore),
          endScore: trajectory[trajectory.length - 1].score, trajectory
        };
      }
      case 'regulatory_change': {
        const trajectory: { date: string; score: number }[] = [];
        for (let w = 0; w <= 12; w++) {
          let score: number;
          if (w < 2) score = currentScore;
          else if (w < 4) score = currentScore - 15 + (w - 2) * 2;
          else score = Math.min(100, currentScore - 11 + (w - 4) * 2.5);
          trajectory.push({ date: fmt(addWeeks(today, w)), score: Math.round(Math.max(0, Math.min(100, score))) });
        }
        return {
          scenarioId, name: 'Regulatory Change Hits', nameEt: 'Regulatiivne muudatus',
          color: '#f59e0b', currentScore: Math.round(currentScore),
          endScore: trajectory[trajectory.length - 1].score, trajectory
        };
      }
      default:
        return null;
    }
  }
}
