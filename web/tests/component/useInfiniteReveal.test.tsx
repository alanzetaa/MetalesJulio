import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { useInfiniteReveal } from "../../src/hooks/useInfiniteReveal";

let observedCallback: IntersectionObserverCallback | null = null;

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observedCallback = callback;
  }
  observe() {}
  disconnect() {}
}

let latestVisibleCount = 0;

function TestFeed({ total, resetKey }: { total: number; resetKey: string }) {
  const { visibleCount, sentinelRef } = useInfiniteReveal(total, resetKey, 10);
  latestVisibleCount = visibleCount;
  return <div ref={sentinelRef} data-testid="sentinel" />;
}

describe("useInfiniteReveal", () => {
  beforeEach(() => {
    observedCallback = null;
    latestVisibleCount = 0;
    // @ts-expect-error -- stub global para el test, no existe en jsdom
    global.IntersectionObserver = FakeIntersectionObserver;
  });

  afterEach(() => {
    // @ts-expect-error -- limpiar el stub
    delete global.IntersectionObserver;
  });

  it("arranca mostrando pageSize elementos", () => {
    render(<TestFeed total={50} resetKey="a" />);
    expect(latestVisibleCount).toBe(10);
  });

  it("revela pageSize más cuando el centinela intersecta, sin pasar el total", () => {
    render(<TestFeed total={15} resetKey="a" />);
    expect(latestVisibleCount).toBe(10);

    act(() => {
      observedCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(latestVisibleCount).toBe(15); // 10 + 10, pero tope en 15
  });

  it("reinicia a pageSize cuando cambia resetKey", () => {
    const { rerender } = render(<TestFeed total={50} resetKey="a" />);

    act(() => {
      observedCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
    expect(latestVisibleCount).toBe(20);

    rerender(<TestFeed total={50} resetKey="b" />);
    expect(latestVisibleCount).toBe(10);
  });
});
