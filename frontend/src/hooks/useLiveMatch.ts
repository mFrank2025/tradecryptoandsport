import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LiveMatchState, MatchEvent } from '../types';

interface UseLiveMatchOptions {
  matchId: number;
  enabled?: boolean;
}

interface LiveMatchHook {
  state: LiveMatchState | null;
  connected: boolean;
  lastEvent: MatchEvent | null;
  emit: (event: string, data: unknown) => void;
}

export function useLiveMatch({ matchId, enabled = true }: UseLiveMatchOptions): LiveMatchHook {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<LiveMatchState | null>(null);
  const [lastEvent, setLastEvent] = useState<MatchEvent | null>(null);

  useEffect(() => {
    if (!enabled || !matchId) return;

    const socket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_match', { match_id: matchId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('match_state', (data: LiveMatchState) => {
      setState(data);
    });

    socket.on('match_update', (data: Partial<LiveMatchState>) => {
      setState((prev) => prev ? { ...prev, ...data } : null);
    });

    socket.on('new_event', (event: MatchEvent) => {
      setLastEvent(event);
      setState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          events: [event, ...prev.events],
          last_event: event,
          home_score: event.type === 'goal' || event.type === 'penalty_goal'
            ? (event.team_id === prev.home_lineup[0]?.team_id ? prev.home_score + 1 : prev.home_score)
            : prev.home_score,
          away_score: event.type === 'goal' || event.type === 'penalty_goal'
            ? (event.team_id !== prev.home_lineup[0]?.team_id ? prev.away_score + 1 : prev.away_score)
            : prev.away_score,
        };
      });
    });

    socket.on('score_update', (data: { home_score: number; away_score: number }) => {
      setState((prev) => prev ? { ...prev, ...data } : null);
    });

    socket.on('minute_update', (data: { minute: number }) => {
      setState((prev) => prev ? { ...prev, minute: data.minute } : null);
    });

    return () => {
      socket.emit('leave_match', { match_id: matchId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [matchId, enabled]);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { state, connected, lastEvent, emit };
}
