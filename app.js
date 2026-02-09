const DATA_URL = "./data/plan.json";
const TODO_STORAGE_KEY = "architect-today-todo-checks-v1";
const GOAL_STORAGE_KEY = "architect-daily-goals-v1";
const SYNC_CONFIG_KEY = "architect-sync-config-v1";
const SYNC_FILE_PATH = "data/progress.json";

const WEEKLY_DAY_PLANS = [
  {
    id: "mon",
    label: "月",
    todos: [
      "構造 / 構造② 不静定構造の基礎 / 総合資格_復習ワーク / 実解 / 実施済み",
      "法規 / 法規③ 集団規定1（道路） / 総合資格_問題集 / 実解（5分/問）×10問 / 実施済み",
      "計画 / 計画③ 建築作品・建築家 / 自作カード / 即答＋逆引き / 実施済み"
    ],
    belongings: ["法規問題集", "構造復習ワーク（必要時）", "作品カード"]
  },
  {
    id: "tue",
    label: "火",
    todos: [
      "法規 / 法規③④（道路・用途地域・建蔽率/容積率） / 総合資格_問題集 / 判断回転（60〜90秒/問）×10問 / 15分",
      "法規 / 法規④（避難：出入口幅・避難距離） / 総合資格_問題集 / 判断回転×5問＋1分想起 / 10分",
      "計画 / 計画③（既習作品） / 自作カード / 特徴→作品名 逆引き×5 / 5分"
    ],
    belongings: ["法規問題集", "作品カード"]
  },
  {
    id: "wed",
    label: "水",
    todos: [
      "全科目 / バランス問題集（全科目ミックス3問前後ずつ） / 総合資格_バランス学習問題 / 3問×5科目を可能な範囲で実解 / 15分",
      "構造 / 構造⑦ 振動・耐震 / 構造メモ / 即答チェック（3EI/h³・12EI/h³・Q=ma・用語） / 5分",
      "計画 / 計画③（既習作品） / 作品カード / 即答（作品→建築家＋特徴1行）×10 / 5分"
    ],
    belongings: ["バランス問題集", "構造メモ（可能なら）", "作品カード"]
  },
  {
    id: "thu",
    label: "木",
    todos: [
      "法規 / 法規③④（用途地域・制度：地区計画/建築協定） / 総合資格_問題集 / 実解（5分/問）×5問 / 25分",
      "法規 / 法規③（建蔽率/容積率） / 総合資格_問題集 / 判断回転×5問 / 10分"
    ],
    belongings: ["法規問題集"]
  },
  {
    id: "fri",
    label: "金",
    todos: [
      "全科目 / バランス問題集（全科目ミックス3問前後ずつ） / 総合資格_バランス学習問題 / 弱かった科目のみ再挑戦 / 15分",
      "計画 / 計画③（新規作品または既習維持） / 作品カード / 追加5件 or ミックス即答 / 15分"
    ],
    belongings: ["バランス問題集", "作品集または作品カード"]
  },
  {
    id: "sat",
    label: "土",
    todos: [
      "法規 / 法規③④（道路・用途地域・建蔽率/容積率・避難・制度） / 総合資格_問題集 / 実解（5分/問）×15〜20問 / 75〜100分",
      "構造 / 構造②⑦（不静定構造・振動） / 総合資格_該当演習 / 間違えた問題のみ解き直し / 40〜60分",
      "施工または環境 / 施工①〜⑥または環境①〜⑤ / 総合資格_予習ワーク / 見るだけ / 20分"
    ],
    belongings: ["法令集", "法規問題集", "構造教材", "施工または環境の冊子"]
  },
  {
    id: "sun",
    label: "日",
    todos: [
      "法規 / 法規③④（間違えた論点） / 法規メモ＋法令集 / 判断順を声に出す＋必要条文確認 / 45〜60分",
      "計画 / 計画③（既習15件ミックス） / 作品カード / 即答＋逆引き / 20分",
      "全科目 / バランス問題集（全科目ミックス3問前後ずつ） / 総合資格_バランス学習問題 / 弱点科目のみ実解 / 10〜15分",
      "運用 / 次週準備 / 学習ログ / 今週の未完了確認＋持ち物セット / 10分"
    ],
    belongings: ["法令集", "法規メモ", "作品カード", "バランス問題集"]
  }
];

const el = {
  title: document.getElementById("app-title"),
  subtitle: document.getElementById("header-subtitle"),
  todayChip: document.getElementById("today-chip"),
  todaySummary: document.getElementById("today-summary"),
  todaySwipe: document.getElementById("today-swipe"),
  todayGoalInput: document.getElementById("today-goal-input"),
  syncToken: document.getElementById("sync-token"),
  syncEnable: document.getElementById("sync-enable"),
  syncPull: document.getElementById("sync-pull"),
  syncStatus: document.getElementById("sync-status"),
  weekPicker: document.getElementById("week-picker"),
  weekChipsLegacy: document.getElementById("week-chips"),
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
  today: new Date(),
  todoChecks: {},
  dailyGoals: {},
  sync: {
    owner: "ameikababa-eng",
    repo: "ikkyuu",
    branch: "main",
    token: "",
    enabled: false,
    sha: null,
    timer: null
  }
};

async function init() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`plan.json を取得できません (${res.status})`);
    const data = await res.json();
    validatePlan(data);

    state.data = data;
    state.todoChecks = loadTodoChecks();
    state.dailyGoals = loadDailyGoals();
    state.sync = loadSyncConfig();
    bindSyncControls();
    state.selectedWeekId = findDefaultWeek(data.weeks, state.today).id;
    render();
    startDayWatcher();
    if (state.sync.enabled) {
      await pullFromGitHubSync();
    } else {
      setSyncStatus("同期: オフ");
    }
  } catch (error) {
    showError(error.message);
  }
}

function startDayWatcher() {
  setInterval(syncTodayDate, 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncTodayDate();
  });
}

function syncTodayDate() {
  const prevDate = toDateId(state.today);
  const now = new Date();
  const nowDate = toDateId(now);
  if (prevDate === nowDate) return;

  state.today = now;
  const defaultWeek = findDefaultWeek(state.data.weeks, now);
  state.selectedWeekId = defaultWeek.id;
  render();
}

function loadTodoChecks() {
  try {
    return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveTodoChecks() {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(state.todoChecks));
}

function loadDailyGoals() {
  try {
    return JSON.parse(localStorage.getItem(GOAL_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveDailyGoals() {
  localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(state.dailyGoals));
}

function loadSyncConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY) || "{}");
    return {
      owner: raw.owner || "ameikababa-eng",
      repo: raw.repo || "ikkyuu",
      branch: raw.branch || "main",
      token: raw.token || "",
      enabled: Boolean(raw.enabled && raw.token),
      sha: null,
      timer: null
    };
  } catch {
    return {
      owner: "ameikababa-eng",
      repo: "ikkyuu",
      branch: "main",
      token: "",
      enabled: false,
      sha: null,
      timer: null
    };
  }
}

function saveSyncConfig() {
  localStorage.setItem(
    SYNC_CONFIG_KEY,
    JSON.stringify({
      owner: state.sync.owner,
      repo: state.sync.repo,
      branch: state.sync.branch,
      token: state.sync.token,
      enabled: state.sync.enabled
    })
  );
}

function setSyncStatus(text) {
  if (el.syncStatus) el.syncStatus.textContent = text;
}

function bindSyncControls() {
  if (!el.syncEnable || !el.syncPull || !el.syncToken) return;

  el.syncToken.value = state.sync.token;

  el.syncEnable.addEventListener("click", async () => {
    const token = (el.syncToken.value || "").trim();
    if (!token) {
      setSyncStatus("同期: トークンを入力してください");
      return;
    }
    state.sync.token = token;
    state.sync.enabled = true;
    saveSyncConfig();
    setSyncStatus("同期: 接続中...");
    await pullFromGitHubSync();
    await pushToGitHubSync("sync: initialize shared progress");
  });

  el.syncPull.addEventListener("click", async () => {
    if (!state.sync.enabled) {
      setSyncStatus("同期: 先に同期を有効化してください");
      return;
    }
    setSyncStatus("同期: 最新を取得中...");
    await pullFromGitHubSync();
  });
}

function getGitHubContentsUrl() {
  const { owner, repo, branch } = state.sync;
  return `https://api.github.com/repos/${owner}/${repo}/contents/${SYNC_FILE_PATH}?ref=${encodeURIComponent(branch)}`;
}

function encodeBase64Json(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))));
}

function decodeBase64Json(base64Text) {
  const text = decodeURIComponent(escape(atob(base64Text.replace(/\n/g, ""))));
  return JSON.parse(text);
}

function mergeChecks(remoteChecks, localChecks) {
  const merged = {};
  const buckets = new Set([...Object.keys(remoteChecks || {}), ...Object.keys(localChecks || {})]);
  buckets.forEach((bucket) => {
    merged[bucket] = {};
    const remoteBucket = remoteChecks?.[bucket] || {};
    const localBucket = localChecks?.[bucket] || {};
    const taskIndexes = new Set([...Object.keys(remoteBucket), ...Object.keys(localBucket)]);
    taskIndexes.forEach((idx) => {
      merged[bucket][idx] = Boolean(remoteBucket[idx] || localBucket[idx]);
    });
  });
  return merged;
}

async function pullFromGitHubSync() {
  if (!state.sync.enabled || !state.sync.token) return;
  try {
    const res = await fetch(getGitHubContentsUrl(), {
      headers: {
        Authorization: `Bearer ${state.sync.token}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (res.status === 404) {
      state.sync.sha = null;
      setSyncStatus("同期: 共有ファイル未作成（初回保存で作成）");
      return;
    }

    if (!res.ok) throw new Error(`取得失敗 (${res.status})`);

    const payload = await res.json();
    state.sync.sha = payload.sha || null;
    const remoteChecks = decodeBase64Json(payload.content || "e30=");
    state.todoChecks = mergeChecks(remoteChecks, state.todoChecks);
    saveTodoChecks();
    renderToday();
    setSyncStatus("同期: 最新データ取得済み");
  } catch (error) {
    setSyncStatus(`同期エラー: ${error.message}`);
  }
}

function scheduleSyncPush() {
  if (!state.sync.enabled) return;
  if (state.sync.timer) clearTimeout(state.sync.timer);
  state.sync.timer = setTimeout(() => {
    pushToGitHubSync("sync: update todo progress");
  }, 1200);
}

async function pushToGitHubSync(message) {
  if (!state.sync.enabled || !state.sync.token) return;
  try {
    const body = {
      message,
      branch: state.sync.branch,
      content: encodeBase64Json(state.todoChecks)
    };
    if (state.sync.sha) body.sha = state.sync.sha;

    const res = await fetch(getGitHubContentsUrl(), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${state.sync.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (res.status === 409) {
      await pullFromGitHubSync();
      return pushToGitHubSync(message);
    }

    if (!res.ok) throw new Error(`保存失敗 (${res.status})`);

    const payload = await res.json();
    state.sync.sha = payload.content?.sha || state.sync.sha;
    setSyncStatus("同期: 保存済み");
  } catch (error) {
    setSyncStatus(`同期エラー: ${error.message}`);
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

function toDateId(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(baseDate, offset) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset);
  return d;
}

function formatDateWithWeekday(date) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}/${date.getDate()}（${weekdays[date.getDay()]}）`;
}

function getRelativeLabel(date, base) {
  const dayMs = 24 * 60 * 60 * 1000;
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const b = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const diff = Math.round((a - b) / dayMs);
  if (diff === 0) return "今日";
  if (diff === -1) return "昨日";
  if (diff === 1) return "明日";
  return "";
}

function getMondayStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayPlan(date) {
  const day = date.getDay();
  const mondayBased = day === 0 ? 6 : day - 1;
  return WEEKLY_DAY_PLANS[mondayBased];
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

function getChecklistKey(date, week) {
  return `${toDateId(date)}|${week.id}|daily`;
}

function getChecklistBucket(key) {
  if (!state.todoChecks[key]) state.todoChecks[key] = {};
  return state.todoChecks[key];
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
  renderWeekPicker();

  const selected = getWeekById(state.selectedWeekId);
  renderToday();
  renderWeekPanel(selected);
  renderGantt();
  renderSubjectProgress();
}

function renderToday() {
  if (!el.todaySwipe) return;
  const weekStart = getMondayStart(state.today);
  const todayWeek = findDefaultWeek(state.data.weeks, state.today);
  const focus = getSubject(todayWeek.focus);
  el.todayChip.textContent = `${focus.name} 重点`;
  el.todayChip.style.background = focus.color;
  el.todayChip.style.color = focus.textColor;
  el.todaySummary.textContent = "今週（月〜日）を横スワイプ。過ぎた日も週内は残ります。";

  const goalKey = toDateId(state.today);
  if (el.todayGoalInput) {
    el.todayGoalInput.value = state.dailyGoals[goalKey] || "";
    el.todayGoalInput.oninput = (event) => {
      state.dailyGoals[goalKey] = event.target.value;
      saveDailyGoals();
    };
  }

  el.todaySwipe.innerHTML = "";

  for (let i = 0; i < 7; i += 1) {
    const targetDate = addDays(weekStart, i);
    const week = findDefaultWeek(state.data.weeks, targetDate);
    const status = getScheduleStatus(week, targetDate);
    const dayPlan = WEEKLY_DAY_PLANS[i];
    const tasks = dayPlan.todos;
    const checks = getChecklistBucket(getChecklistKey(targetDate, week));
    const checkedCount = tasks.reduce((sum, _, idx) => sum + (checks[idx] ? 1 : 0), 0);
    const relative = getRelativeLabel(targetDate, state.today);

    const card = document.createElement("article");
    card.className = "today-slide-card";
    if (toDateId(targetDate) === toDateId(state.today)) card.classList.add("is-active-day");
    card.innerHTML = `
      <div class="today-slide-head">
        <p class="today-day-label">${dayPlan.label} | ${formatDateWithWeekday(targetDate)} ${relative ? `（${relative}）` : ""}</p>
        <span class="pill muted">${checkedCount}/${tasks.length}</span>
      </div>
      <p class="today-day-meta">${week.label} | ${status.label}</p>
      <p class="today-pack-title">持ち物（通勤パック）</p>
    `;

    const packList = document.createElement("ul");
    packList.className = "todo-list today-swipe-list";
    dayPlan.belongings.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      packList.appendChild(li);
    });

    const todoTitle = document.createElement("p");
    todoTitle.className = "today-pack-title";
    todoTitle.textContent = "ToDo（チェック可）";

    const todoList = document.createElement("ul");
    todoList.className = "todo-list today-swipe-list";
    tasks.forEach((task, idx) => {
      const li = document.createElement("li");
      li.className = "todo-item";

      const label = document.createElement("label");
      label.className = "todo-checkbox";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(checks[idx]);
      input.setAttribute("aria-label", `${dayPlan.label} ToDo ${idx + 1}`);

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = task;
      if (input.checked) text.classList.add("done");

      input.addEventListener("change", (event) => {
        checks[idx] = Boolean(event.target.checked);
        saveTodoChecks();
        scheduleSyncPush();
        text.classList.toggle("done", Boolean(event.target.checked));
        const doneNow = tasks.reduce((sum, _, j) => sum + (checks[j] ? 1 : 0), 0);
        const badge = card.querySelector(".pill");
        if (badge) badge.textContent = `${doneNow}/${tasks.length}`;
      });

      label.append(input, text);
      li.appendChild(label);
      todoList.appendChild(li);
    });

    card.append(packList, todoTitle, todoList);
    el.todaySwipe.appendChild(card);
  }
}

function renderWeekPicker() {
  if (!el.weekPicker && !el.weekChipsLegacy) return;
  const sortedWeeks = [...state.data.weeks].sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const currentIndex = Math.max(
    0,
    sortedWeeks.findIndex((w) => w.id === state.selectedWeekId)
  );

  const updateWeek = (weekId) => {
    state.selectedWeekId = weekId;
    const selected = getWeekById(weekId);
    renderWeekPicker();
    renderToday();
    renderWeekPanel(selected);
    renderGantt();
    renderSubjectProgress();
  };

  if (el.weekPicker) {
    const prevDisabled = currentIndex <= 0 ? "disabled" : "";
    const nextDisabled = currentIndex >= sortedWeeks.length - 1 ? "disabled" : "";

    el.weekPicker.innerHTML = `
      <button id="week-prev" class="week-nav-btn" type="button" ${prevDisabled}>前週</button>
      <select id="week-select" class="week-select" aria-label="週選択"></select>
      <button id="week-next" class="week-nav-btn" type="button" ${nextDisabled}>次週</button>
    `;

    const select = document.getElementById("week-select");
    sortedWeeks.forEach((week) => {
      const option = document.createElement("option");
      option.value = week.id;
      option.textContent = `${week.label} (${formatDateRange(week.start, week.end)})`;
      if (week.id === state.selectedWeekId) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      updateWeek(event.target.value);
    });

    const prevBtn = document.getElementById("week-prev");
    const nextBtn = document.getElementById("week-next");

    prevBtn.addEventListener("click", () => {
      if (currentIndex <= 0) return;
      updateWeek(sortedWeeks[currentIndex - 1].id);
    });

    nextBtn.addEventListener("click", () => {
      if (currentIndex >= sortedWeeks.length - 1) return;
      updateWeek(sortedWeeks[currentIndex + 1].id);
    });
    return;
  }

  el.weekChipsLegacy.innerHTML = "";
  sortedWeeks.forEach((week) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip${week.id === state.selectedWeekId ? " active" : ""}`;
    button.textContent = week.label;
    button.addEventListener("click", () => updateWeek(week.id));
    el.weekChipsLegacy.appendChild(button);
  });
}

function renderWeekPanel(week) {
  const focus = getSubject(week.focus);
  const status = getScheduleStatus(week);
  const lanes = buildLanes(week);
  const isMobile = window.matchMedia("(max-width: 640px)").matches;

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
      <span class="focus-chip" style="background:#eef3fa;color:#44506a">${formatDateRange(week.start, week.end)}</span>
    </div>
    <p class="state-text">回転ルール: ${state.data.rules.lawTimeLimit}</p>

    <details open>
      <summary>重点単元（正式名称）</summary>
      <ul class="todo-list">${focusUnitList || "<li>この週の重点単元を設定してください。</li>"}</ul>
    </details>

    <details ${isMobile ? "" : "open"}>
      <summary>予習レーン（平日・通勤）</summary>
      <ul class="todo-list">${previewList}</ul>
    </details>

    <details ${isMobile ? "" : "open"}>
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
  const weeks = [...state.data.weeks].sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const minDate = parseDate(weeks[0].start);
  const maxDate = parseDate(weeks[weeks.length - 1].end);
  const totalMs = maxDate - minDate || 1;

  el.ganttTrack.innerHTML = "";

  state.data.subjects.forEach((subject) => {
    const row = document.createElement("div");
    row.className = "subject-gantt-row";

    const label = document.createElement("div");
    label.className = "subject-gantt-label";
    label.textContent = subject.name;
    label.style.background = subject.color;
    label.style.color = subject.textColor;

    const lane = document.createElement("div");
    lane.className = "subject-gantt-lane";

    weeks
      .filter((week) => week.focus === subject.id)
      .forEach((week) => {
        const bar = document.createElement("button");
        bar.type = "button";
        bar.className = `subject-gantt-bar${week.id === state.selectedWeekId ? " selected" : ""}`;

        const startRatio = clamp((parseDate(week.start) - minDate) / totalMs, 0, 1);
        const endRatio = clamp((parseDate(week.end) - minDate) / totalMs, 0, 1);
        bar.style.left = `${startRatio * 100}%`;
        bar.style.width = `${Math.max((endRatio - startRatio) * 100, 7)}%`;
        bar.style.background = subject.color;
        bar.style.color = subject.textColor;
        bar.textContent = week.label.replace("第", "");

        const status = getScheduleStatus(week);
        bar.title = `${week.label} | ${subject.name} | ${status.label}`;

        bar.addEventListener("click", () => {
          state.selectedWeekId = week.id;
          const selected = getWeekById(week.id);
          renderWeekPicker();
          renderToday();
          renderWeekPanel(selected);
          renderGantt();
          renderSubjectProgress();
        });

        lane.appendChild(bar);
      });

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
