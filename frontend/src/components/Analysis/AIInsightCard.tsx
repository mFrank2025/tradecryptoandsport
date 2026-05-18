import { Sparkles, AlertCircle, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { PlayerAnalysis } from '../../types';
import { PositionBadge } from '../UI/Badge';

interface AIInsightCardProps {
  analysis: PlayerAnalysis;
}

export default function AIInsightCard({ analysis }: AIInsightCardProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Overall Score */}
      <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
        <div className="text-center">
          <div className="text-4xl font-black text-emerald-400">{analysis.overall_rating.toFixed(1)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Rating Generale</div>
        </div>
        {analysis.potential_rating && (
          <>
            <div className="text-gray-600 text-2xl font-thin">→</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{analysis.potential_rating.toFixed(1)}</div>
              <div className="text-xs text-gray-400 mt-0.5">Potenziale</div>
            </div>
          </>
        )}
        <div className="ml-auto text-xs text-gray-500">
          {new Date(analysis.analysis_date).toLocaleDateString('it-IT')}
        </div>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-emerald-400">Punti di Forza</h4>
          </div>
          <div className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-sm">{s.score}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-300">{s.area}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-semibold text-red-400">Aree di Miglioramento</h4>
          </div>
          <div className="space-y-2">
            {analysis.weaknesses.map((w, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                <div className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${
                  w.priority === 'high' ? 'bg-red-600 text-white' :
                  w.priority === 'medium' ? 'bg-orange-600 text-white' :
                  'bg-yellow-600 text-black'
                }`}>
                  {w.priority === 'high' ? 'ALTA' : w.priority === 'medium' ? 'MEDIA' : 'BASSA'}
                </div>
                <div>
                  <div className="text-sm font-medium text-red-300">{w.area}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{w.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Tips */}
      {analysis.improvement_tips.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-blue-400">Consigli di Miglioramento</h4>
          </div>
          <div className="space-y-2">
            {analysis.improvement_tips.map((tip, i) => (
              <div key={i} className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                <div className="text-xs font-semibold text-blue-400 uppercase mb-1">{tip.category}</div>
                <div className="text-sm text-gray-300">{tip.tip}</div>
                {tip.drill && (
                  <div className="text-xs text-gray-500 mt-1">Esercizio: {tip.drill}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Suggestions */}
      {analysis.role_suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-purple-400">Ruoli Suggeriti</h4>
          </div>
          <div className="space-y-2">
            {analysis.role_suggestions.slice(0, 3).map((role, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-800/50 rounded-lg">
                <span className="text-2xl font-black text-purple-400">#{i + 1}</span>
                <PositionBadge position={role.position} />
                <div className="flex-1">
                  <div className="text-xs text-gray-400">{role.explanation}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-400">{role.fit_percentage}%</div>
                  <div className="text-xs text-gray-500">adattabilità</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tactical Notes */}
      {analysis.tactical_notes && (
        <div className="p-3 bg-gray-800 rounded-lg border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Note Tattiche</span>
          </div>
          <p className="text-sm text-gray-300">{analysis.tactical_notes}</p>
        </div>
      )}

      {analysis.model_used && (
        <div className="text-xs text-gray-600 text-right">Modello: {analysis.model_used}</div>
      )}
    </div>
  );
}
