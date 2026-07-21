import { useState } from "react";

export function useLightbox() {
  const [fotos, setFotos] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);

  function open(fotoPaths: string[], startIndex = 0) {
    setFotos(fotoPaths);
    setIndex(startIndex);
  }

  function close() {
    setFotos(null);
  }

  return { fotos, index, open, close, setIndex };
}
