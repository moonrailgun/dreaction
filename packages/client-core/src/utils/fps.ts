export function runFPSMeter(onUpdate: (fps: number) => void) {
  let fps = 0;
  let lastTime = performance.now();
  let frameCount = 0;
  let running = true;
  let timer: number;

  const updateFPS = () => {
    if (!running) {
      return;
    }

    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = now;

      onUpdate(fps);
    }

    timer = requestAnimationFrame(updateFPS);
  };

  updateFPS();

  // return stop function
  return () => {
    running = false;
    cancelAnimationFrame(timer);
  };
}
