import { test } from "node:test";
import assert from "node:assert/strict";
import {
  processJamo,
  compose,
  emptyComp,
  isHangulJamo,
  type Comp,
} from "../src/lib/hangul.ts";

/**
 * Simulate typing a sequence of jamo into a crossword row, mirroring how
 * CrosswordGame drives the automaton: each `advance` finalizes the active
 * cell and carries `next` into the following cell. Returns the joined
 * syllable string (all finalized cells + the still-composing last cell).
 */
function typeSeq(jamos: string[]): string {
  const cells: string[] = [];
  let state: Comp = emptyComp();
  for (const j of jamos) {
    const res = processJamo(state, j);
    if (res.advance) {
      cells.push(res.display);
    }
    state = res.next;
  }
  cells.push(compose(state));
  return cells.join("");
}

const seq = (s: string) => typeSeq([...s]);

/**
 * Same as typeSeq but with a fixed number of cells, mirroring how
 * CrosswordGame.handleJamo behaves inside a crossword word: when a jamo forces
 * a new syllable (`advance`) but there is no next cell, the finalized cell is
 * restored to its full pre-jamo syllable (keeping any 종성) and the spilled
 * jamo is dropped — the P3-2 fix. Returns the joined cell contents.
 */
function typeSeqBounded(jamos: string[], maxCells: number): string {
  const cells: string[] = new Array(maxCells).fill("");
  let idx = 0;
  let comp: Comp = emptyComp();
  for (const j of jamos) {
    const buf = comp;
    const res = processJamo(buf, j);
    cells[idx] = res.display;
    if (!res.advance) {
      comp = res.next;
      continue;
    }
    if (idx + 1 < maxCells) {
      idx += 1;
      cells[idx] = compose(res.next);
      comp = res.next;
    } else {
      // End of word — keep the full syllable, drop the spilled jamo.
      cells[idx] = compose(buf);
      comp = buf;
    }
  }
  return cells.join("");
}

// ---------------------------------------------------------------------------
// Golden cases — the documented, expected everyday behavior.
// ---------------------------------------------------------------------------

test("golden: 초성+중성+종성 → 강", () => {
  assert.equal(seq("ㄱㅏㅇ"), "강");
});

test("golden: 초성+중성 → 가", () => {
  assert.equal(seq("ㄱㅏ"), "가");
});

test("golden: 종성 뒤 모음이면 종성이 다음 글자 초성으로 재배치 (간+ㅏ → 가나)", () => {
  // 가 → (ㄴ)간 → (ㅏ) ㄴ이 다음 초성으로 이동 → 가나
  assert.equal(seq("ㄱㅏㄴㅏ"), "가나");
});

test("golden: 겹받침 조합 ㄹ+ㄱ → ㄺ (읽)", () => {
  assert.equal(seq("ㅇㅣㄹㄱ"), "읽");
});

test("golden: 겹받침 뒤 모음 → 뒤 자음만 다음 초성으로 (읽+ㅓ → 일거)", () => {
  // 읽 (jong=ㄺ) 뒤 ㅓ → ㄹ은 남고 ㄱ이 이동 → 일 + 거
  assert.equal(seq("ㅇㅣㄹㄱㅓ"), "일거");
});

test("golden: 겹모음 조합 ㅗ+ㅏ → ㅘ (과)", () => {
  assert.equal(seq("ㄱㅗㅏ"), "과");
});

test("golden: 실제 KO 정답 음절 조합 (봉우리)", () => {
  assert.equal(seq("ㅂㅗㅇㅇㅜㄹㅣ"), "봉우리");
});

test("golden: 종성이 다음 셀로 이동할 공간이 있으면 분리 (간+ㅏ, 2칸 → 가나)", () => {
  assert.equal(typeSeqBounded(["ㄱ", "ㅏ", "ㄴ", "ㅏ"], 2), "가나");
});

test("golden: 단어 마지막 셀에서 이동 불가면 종성 유지 (간+ㅏ, 1칸 → 간)", () => {
  // Without the P3-2 fix this would drop to "가" (종성 소실).
  assert.equal(typeSeqBounded(["ㄱ", "ㅏ", "ㄴ", "ㅏ"], 1), "간");
});

test("golden: 마지막 셀 겹받침도 유지 (읽+ㅓ, 1칸 → 읽)", () => {
  assert.equal(typeSeqBounded(["ㅇ", "ㅣ", "ㄹ", "ㄱ", "ㅓ"], 1), "읽");
});

// ---------------------------------------------------------------------------
// Edge cases.
// ---------------------------------------------------------------------------

test("edge: 빈 셀에 모음 단독 → 모음 자모 그대로 표시", () => {
  const res = processJamo(emptyComp(), "ㅏ");
  assert.equal(res.display, "ㅏ");
  assert.equal(res.advance, false);
  assert.deepEqual(res.next, { cho: null, jung: "ㅏ", jong: null });
});

test("edge: unknown 문자는 무시하고 상태 유지", () => {
  const start: Comp = { cho: "ㄱ", jung: null, jong: null };
  const res = processJamo(start, "x");
  assert.equal(res.display, "ㄱ");
  assert.equal(res.advance, false);
  assert.deepEqual(res.next, start);
});

test("edge: 라틴 문자도 무시 (isHangulJamo false)", () => {
  assert.equal(isHangulJamo("A"), false);
  assert.equal(isHangulJamo("ㄱ"), true);
  assert.equal(isHangulJamo("ㅏ"), true);
  assert.equal(isHangulJamo("1"), false);
});

test("edge: 초성 두 개 연달아 → 첫 자음 확정 후 새 글자 시작", () => {
  const res = processJamo({ cho: "ㄱ", jung: null, jong: null }, "ㄴ");
  assert.equal(res.display, "ㄱ");
  assert.equal(res.advance, true);
  assert.deepEqual(res.next, { cho: "ㄴ", jung: null, jong: null });
});

test("edge: 완성 음절 뒤 조합 불가한 모음 → 다음 셀에서 모음 단독 시작", () => {
  // 가 (ㅏ) 뒤 ㅓ 는 겹모음 불가 → advance, next=중성만
  const res = processJamo({ cho: "ㄱ", jung: "ㅏ", jong: null }, "ㅓ");
  assert.equal(res.display, "가");
  assert.equal(res.advance, true);
  assert.deepEqual(res.next, { cho: null, jung: "ㅓ", jong: null });
});

test("edge: 받침 불가 자음(ㄸ 등)은 종성이 안 되고 다음 초성으로", () => {
  // 'ㄸ' 은 JONG 목록에 없음 → 종성으로 안 붙고 새 글자 초성
  const res = processJamo({ cho: "ㄱ", jung: "ㅏ", jong: null }, "ㄸ");
  assert.equal(res.display, "가");
  assert.equal(res.advance, true);
  assert.deepEqual(res.next, { cho: "ㄸ", jung: null, jong: null });
});

test("edge: compose 부분 상태 — 초성만 있으면 자모 그대로", () => {
  assert.equal(compose({ cho: "ㄴ", jung: null, jong: null }), "ㄴ");
  assert.equal(compose(emptyComp()), "");
});
