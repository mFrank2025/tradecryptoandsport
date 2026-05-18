import { PlayerAnalysis } from '../../types';
import AIInsightCard from '../Analysis/AIInsightCard';
import Card from '../UI/Card';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PlayerAnalysisCardProps {
  analysis: PlayerAnalysis;
  isLatest?: boolean;
}

export default function PlayerAnalysisCard({ analysis, isLatest }: PlayerAnalysisCardProps) {
  return (
    <Card className={isLatest ? 'border-blue-800/50' : ''}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold text-blue-400">
            Analisi AI {isLatest ? '(Più recente)' : ''}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {format(new Date(analysis.analysis_date), 'd MMM yyyy', { locale: it })}
        </span>
      </div>
      <AIInsightCard analysis={analysis} />
    </Card>
  );
}
