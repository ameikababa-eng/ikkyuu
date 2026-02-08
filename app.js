const DATA_URL = "./data/plan.json";

const el = {
  title: document.getElementById("app-title"),
  subtitle: document.getElementById("header-subtitle"),
  todayChip: document.getElementById("today-chip"),
  todaySummary: document.getElementById("today-summary"),
  todayTodoList: document.getElementById("today-todo-list"),
  weekChips: document.getElementById("week-chips"),
  weekPanel: document.getElementById("week-panel"),
  weekStatus: document.getElementById("week-status-pill"),
  monthAccordion: document.getElementById("month-accordion"),
  legend: document.getElementById("gantt-legend"),
  ganttTrack: document.getElementById("gantt-track"),
  subjectProgress: document.getElementById("subject-progress"),
  errorCard: document.getElementById("error-card"),
  errorMessage: document.getElementById("error-message")
};

let state = {
  data: null,
  selectedWeekId: null,
  today: new Date()
};

async function init() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`plan.json を取得できません (${res.status})`);
    const data = await res.json();
    validatePlan(data);

    state.data = data;
    state.selectedWeekId = findDefaultWeek(data.weeks, state.today).id;
    render();
  } catch (error) {
    showError(error.message);
  }
}

function validatePlan(data) {
  if (!data?.meta?.title || !data?.meta?.examDate) throw new Error("meta.title / meta.examDate が必要です。");
  if (!Array.isArray(data.subjects) || data.subjects.length === 0) throw new Error("subjects が必要です。");
  if (!Array.isArray(data.months) || data.months.length === 0) throw new Error("months が必要です。");
  if (!Array.isArray(data.weeks) || data.weeks.length === 0) throw new Error("weeks が必要です。");

  const subjectIds = new Set(data.subjects.map((s) => s.id));
  const monthIds = new Set(data.months.map((m) => m.id));

  data.weeks.forEach((w) => {
    if (!w.id || !w.label || !w.start || !w.end || !w.focus || !w.monthId) {
      throw new Error(`weeks に必須項目不足: ${w.id || "(idなし)"}`);
    }
    if (!subjectIds.has(w.focus)) throw new Error(`${w.id} focus が subjects に存在しません。`);
    if (!monthIds.has(w.monthId)) throw new Error(`${w.id} monthId が months に存在しません。`);
  });
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatDateRange(start, end) {
  const s = parseDate(start);
  const e = parseDate(end);
  return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
}

function getSubject(subjectId) {
  return state.data.subjects.find((s) => s.id === subjectId);
}

function getWeekById(weekId) {
  return state.data.weeks.find((w) => w.id === weekId);
}

function findDefaultWeek(weeks, today) {
  const now = new Date(today.toDateString());
  const current = weeks.find((w) => now >= parseDate(w.start) && now <= parseDate(w.end));
  if (current) return current;

  const sorted = [...weeks].sort((a, b) => parseDate(a.start) - parseDate(b.start));
  return sorted.find((w) => parseDate(w.start) > now) || sorted[sorted.length - 1];
}

function getScheduleStatus(week, today = state.today) {
  const now = new Date(today.toDateString());
  const start = parseDate(week.start);
  const end = parseDate(week.end);

  if (now < start) return { code: "ahead", label: "前倒し可" };
  if (now > end) return { code: "late", label: "遅延" };
  return { code: "on-track", label: "進行中" };
}

function statusClass(code) {
  if (code === "ahead") return "status-ahead";
  if (code === "late") return "status-late";
  return "status-on-track";
}

function getPlannedUnits(subjectId, limit = 2) {
  const list = state.data.unitCatalog?.[subjectId] || [];
  return list.slice(0, limit);
}

function buildLanes(week) {
  const focus = getSubject(week.focus);
  const supportSubjects = week.support.map((id) => getSubject(id));
  const focusUnits = week.focusUnits?.length ? week.focusUnits : getPlannedUnits(week.focus, 2);

  const previewLane = [
    `${focus.name} 予習：${focusUnits[0] || "該当単元の読み込み"}`,
    ...supportSubjects.slice(0, 2).map((s) => `${s.name} 維持：即答カード 10〜15分`)
  ];

  const practiceLane = [
    `${focus.name} 演習：${focusUnits[1] || focusUnits[0] || "重点単元"}（休日2〜3h）`,
    week.focus === "law"
      ? "法規演習ルール：5分/問（箱→実解）で回転"
      : "法規維持：条文確認 + 即答5問",
    ...supportSubjects.slice(0, 1).map((s) => `${s.name} 維持演習：短時間で誤答だけ再確認`)
  ];

  return { previewLane, practiceLane };
}

function render() {
  const { data } = state;
  const examDate = parseDate(data.meta.examDate);
  el.title.textContent = data.meta.title;
  el.subtitle.textContent = `試験日: ${examDate.getFullYear()}年${examDate.getMonth() + 1}月${examDate.getDate()}日`;

  renderMonthAccordion();
  renderLegend();
  renderWeekChips();

  const selected = getWeekById(state.selectedWeekId);
  renderToday(selected);
  renderWeekPanel(selected);
  renderGantt();
  renderSubjectProgress();
}

function renderToday(week) {
  const focus = getSubject(week.focus);
  const lanes = buildLanes(week);
  const isWeekend = [0, 6].includes(state.today.getDay());
  const tasks = isWeekend ? lanes.practiceLane : lanes.previewLane;

  el.todayChip.textContent = `${focus.name} 重点`;
  el.todayChip.style.background = focus.color;
  el.todayChip.style.color = focus.textColor;

  const status = getScheduleStatus(week);
  const todayType = isWeekend ? "休日演習" : "平日通勤";
  el.todaySummary.textContent = `${todayType} | ${week.label} (${formatDateRange(week.start, week.end)}) | ${status.label}`;

  el.todayTodoList.innerHTML = "";
  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = task;
    el.todayTodoList.appendChild(li);
  });
}

function renderWeekChips() {
  el.weekChips.innerHTML = "";

  state.data.weeks.forEach((week) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip${week.id === state.selectedWeekId ? " active" : ""}`;
    button.textContent = week.label;
    button.addEventListener("click", () => {
      state.selectedWeekId = week.id;
      const selected = getWeekById(week.id);
      renderWeekChips();
      renderToday(selected);
      renderWeekPanel(selected);
      renderGantt();
      renderSubjectProgress();
    });
    el.weekChips.appendChild(button);
  });
}

function renderWeekPanel(week) {
  const focus = getSubject(week.focus);
  const status = getScheduleStatus(week);
  const lanes = buildLanes(week);

  el.weekStatus.className = `pill ${statusClass(status.code)}`;
  el.weekStatus.textContent = `${status.label}`;

  const support = week.support.map((id) => getSubject(id).name);

  const focusUnitList = (week.focusUnits || []).map((u) => `<li>${u}</li>`).join("");
  const previewList = lanes.previewLane.map((t) => `<li>${t}</li>`).join("");
  const practiceList = lanes.practiceLane.map((t) => `<li>${t}</li>`).join("");

  el.weekPanel.innerHTML = `
    <div class="focus-row">
      <span class="focus-chip" style="background:${focus.color};color:${focus.textColor}">重点: ${focus.name}</span>
      ${support.map((s) => `<span class="focus-chip" style="background:#f3f6fb;color:#46506a">維持: ${s}</span>`).join("")}
      <span class="focus-chip" style="background:#fff6d5;color:#665100">${week.phase || ""}</span>
    </div>
    <p class="state-text">期間: ${formatDateRange(week.start, week.end)}</p>
    <p class="state-text">回転ルール: ${state.data.rules.lawTimeLimit}</p>

    <details open>
      <summary>重点単元（正式名称）</summary>
      <ul class="todo-list">${focusUnitList || "<li>この週の重点単元を設定してください。</li>"}</ul>
    </details>

    <details open>
      <summary>予習レーン（平日・通勤）</summary>
      <ul class="todo-list">${previewList}</ul>
    </details>

    <details open>
      <summary>演習レーン（休日・2〜3h）</summary>
      <ul class="todo-list">${practiceList}</ul>
    </details>
  `;
}

function renderMonthAccordion() {
  el.monthAccordion.innerHTML = "";

  state.data.months.forEach((month, idx) => {
    const details = document.createElement("details");
    details.open = idx < 2;

    const summary = document.createElement("summary");
    summary.textContent = `${month.label} | ${month.goal}`;

    const p = document.createElement("p");
    p.textContent = `フェーズ: ${month.phase}`;

    details.append(summary, p);
    el.monthAccordion.appendChild(details);
  });
}

function renderLegend() {
  el.legend.innerHTML = "";
  state.data.subjects.forEach((subject) => {
    const span = document.createElement("span");
    span.className = "legend-item";
    span.textContent = subject.name;
    span.style.background = subject.color;
    span.style.color = subject.textColor;
    el.legend.appendChild(span);
  });
}

function renderGantt() {
  const weeks = state.data.weeks;
  const minDate = parseDate(weeks[0].start);
  const maxDate = parseDate(weeks[weeks.length - 1].end);
  const totalMs = maxDate - minDate || 1;

  el.ganttTrack.innerHTML = "";

  weeks.forEach((week) => {
    const row = document.createElement("div");
    row.className = "week-row";

    const label = document.createElement("div");
    label.className = "week-label";
    label.textContent = week.label;

    const lane = document.createElement("div");
    lane.className = "lane";

    const bar = document.createElement("button");
    bar.type = "button";
    bar.className = `bar-item${week.id === state.selectedWeekId ? " selected" : ""}`;

    const focus = getSubject(week.focus);
    bar.style.background = focus.color;

    const startRatio = clamp((parseDate(week.start) - minDate) / totalMs, 0, 1);
    const endRatio = clamp((parseDate(week.end) - minDate) / totalMs, 0, 1);

    bar.style.left = `${startRatio * 100}%`;
    bar.style.width = `${Math.max((endRatio - startRatio) * 100, 5)}%`;

    const status = getScheduleStatus(week);
    bar.title = `${week.label} | ${focus.name} | ${status.label}`;

    bar.addEventListener("click", () => {
      state.selectedWeekId = week.id;
      const selected = getWeekById(week.id);
      renderWeekChips();
      renderToday(selected);
      renderWeekPanel(selected);
      renderGantt();
      renderSubjectProgress();
    });

    lane.appendChild(bar);
    row.append(label, lane);
    el.ganttTrack.appendChild(row);
  });
}

function renderSubjectProgress() {
  const now = new Date(state.today.toDateString());
  const weeks = state.data.weeks;

  const subjectWeight = {};
  const subjectDone = {};

  state.data.subjects.forEach((s) => {
    subjectWeight[s.id] = 0;
    subjectDone[s.id] = 0;
  });

  weeks.forEach((w) => {
    subjectWeight[w.focus] += 1;
    w.support.forEach((sid) => {
      subjectWeight[sid] += 0.35;
    });

    const start = parseDate(w.start);
    const end = parseDate(w.end);

    let ratio = 0;
    if (now < start) ratio = 0;
    else if (now > end) ratio = 1;
    else {
      const total = end - start + 24 * 60 * 60 * 1000;
      ratio = clamp((now - start) / total, 0, 1);
    }

    subjectDone[w.focus] += ratio;
    w.support.forEach((sid) => {
      subjectDone[sid] += ratio * 0.35;
    });
  });

  el.subjectProgress.innerHTML = "";

  state.data.subjects.forEach((subject) => {
    const total = subjectWeight[subject.id] || 1;
    const done = subjectDone[subject.id] || 0;
    const progress = clamp(done / total, 0, 1);

    const row = document.createElement("div");
    row.className = "subject-row";

    const label = document.createElement("div");
    label.className = "label";
    label.innerHTML = `<span>${subject.name}（予定進行）</span><span>${Math.round(progress * 100)}%</span>`;

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("span");
    fill.style.width = `${progress * 100}%`;
    fill.style.background = `linear-gradient(90deg, ${subject.color}, ${subject.color})`;

    bar.appendChild(fill);
    row.append(label, bar);
    el.subjectProgress.appendChild(row);
  });
}

function showError(message) {
  el.errorCard.classList.remove("hidden");
  el.errorMessage.textContent = message;
}

init();
