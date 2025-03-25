import { useEffect, useRef, useState } from "react";

const useTypeInput = (defaultInput = "", { delay = 0 }) => {
  const typeTimeoutRef = useRef({});
  const [currentInput, setCurrentInput] = useState(defaultInput);
  const [finalInput, setFinalInput] = useState(defaultInput);
  useEffect(() => {
    clearTimeout(typeTimeoutRef.current);
    typeTimeoutRef.current = setTimeout(() => {
      setFinalInput(currentInput);
    }, delay);
  }, [currentInput, delay]);
  useEffect(() => () => clearTimeout(typeTimeoutRef.current), []);
  return [currentInput, setCurrentInput, finalInput];
};

export default useTypeInput;
