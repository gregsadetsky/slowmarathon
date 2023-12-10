function animateRunners(runners: (Element | null)[]) {
  const runnersEl = document.getElementById("runners")!;
  const runnersEls = runnersEl.querySelectorAll(".runner");

  const removeIndices: number[] = [];
  // move runners to the left
  runnersEls.forEach((runnerEl, runnerIdx) => {
    const left = parseFloat(runnerEl.style.left);
    const speed = Math.random();
    if (left < 1) {
      runnerEl.remove();
      removeIndices.push(runnerIdx);
    } else {
      runnerEl.style.left = `${left - speed}px`;
    }
  });
  // remove pruned runners
  runners = runners.filter(
    (_, runnerIdx) => !removeIndices.includes(runnerIdx)
  );

  // maybe don't animate anymore?
  if (runners.length === 0) {
    return;
  }

  requestAnimationFrame(() => animateRunners(runners));
}

export function initRunners() {
  const runnersEl = document.getElementById("runners")!;

  // randomly span 10-20 divs with 🏃 in them
  // and a few with 🐢 randomly all across the screen
  // then slowly move them to the right

  const numRunners = Math.floor(Math.random() * 8) + 2;
  const numTurtles = Math.floor(Math.random() * 8) + 2;

  const runners = [];
  for (let i = 0; i < numRunners; i++) {
    runners.push("🏃");
  }
  for (let i = 0; i < numTurtles; i++) {
    runners.push("🐢");
  }

  runners.forEach((runner) => {
    const runnerEl = document.createElement("div");

    // place runners everywhere height wise
    runnerEl.style.top = `${Math.floor(
      Math.random() * (window.innerHeight - 80)
    )}px`;

    // place runners mostly on the right side
    runnerEl.style.left = `${Math.floor(
      (2 * window.innerWidth) / 3 +
        (Math.random() * (window.innerWidth - 50)) / 3
    )}px`;

    runnerEl.classList.add("runner");
    runnerEl.innerText = runner;
    runnersEl.appendChild(runnerEl);
  });

  animateRunners(runners);
}
