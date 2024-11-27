import { useMemo, useState } from "react";

const useLoadState = () => {
  const State = useMemo(() => ({ Idle: 0, Loading: 1, Done: 2 }), []);
  const [loadState, setLoadState] = useState(State.Idle);

  const setCurrentState = useMemo(() => ({
    setIdle: () => setLoadState(State.Idle),
    setLoading: () => setLoadState(State.Loading),
    setDone: () => setLoadState(State.Done),
  }), [State]);

  const currentState = useMemo(() => ({
    idle: loadState === State.Idle,
    loading: loadState === State.Loading,
    done: loadState === State.Done,
    ...setCurrentState,
  }), [State, loadState, setCurrentState]);

  return [currentState, setCurrentState];
};

export default useLoadState;
