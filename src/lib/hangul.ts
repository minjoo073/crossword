// Minimal Hangul (2-beolsik) input automaton for the crossword keypad.
// Each grid cell holds exactly ONE syllable. As jamo are typed they compose
// into the active cell; when a jamo cannot extend the current syllable it
// finalizes and carries over to the next cell (with standard 종성 reassignment).

const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

// Compound medials: base vowel + added vowel -> compound vowel.
const JUNG_COMBO: Record<string, string> = {
  "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ",
  "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ",
  "ㅡㅣ": "ㅢ",
};
// Compound finals: base final + added consonant -> compound final.
const JONG_COMBO: Record<string, string> = {
  "ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ",
  "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ", "ㅂㅅ": "ㅄ",
};
// Reverse split for moving the last consonant of a compound final to the next 초성.
const JONG_SPLIT: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(JONG_COMBO).map(([k, v]) => [v, [k[0], k[1]]])
);

export interface Comp {
  cho: string | null;
  jung: string | null;
  jong: string | null;
}

export const emptyComp = (): Comp => ({ cho: null, jung: null, jong: null });

const isVowel = (j: string) => JUNG.includes(j);
const isCho = (j: string) => CHO.includes(j);
const isJong = (j: string) => JONG.includes(j) && j !== "";

/** Render a composition state to its display string (full syllable or partial jamo). */
export function compose(c: Comp): string {
  if (c.cho && c.jung) {
    const ci = CHO.indexOf(c.cho);
    const ji = JUNG.indexOf(c.jung);
    const ki = c.jong ? JONG.indexOf(c.jong) : 0;
    if (ci >= 0 && ji >= 0 && ki >= 0) {
      return String.fromCharCode(0xac00 + (ci * 21 + ji) * 28 + ki);
    }
  }
  return c.cho ?? c.jung ?? "";
}

export interface JamoResult {
  /** Display string for the CURRENT (active) cell after this keystroke. */
  display: string;
  /** If true, the active cell is finalized and the cursor should advance. */
  advance: boolean;
  /** Composition state — for the current cell if !advance, or the NEXT cell if advance. */
  next: Comp;
}

/** Feed one jamo into the active cell's composition state. */
export function processJamo(state: Comp, jamo: string): JamoResult {
  const c = { ...state };

  if (isVowel(jamo)) {
    if (c.cho && !c.jung && !c.jong) {
      c.jung = jamo;
      return { display: compose(c), advance: false, next: c };
    }
    if (c.cho && c.jung && !c.jong) {
      const combo = JUNG_COMBO[c.jung + jamo];
      if (combo) {
        c.jung = combo;
        return { display: compose(c), advance: false, next: c };
      }
      // can't extend -> vowel starts a new (consonant-less) syllable
      return { display: compose(c), advance: true, next: { cho: null, jung: jamo, jong: null } };
    }
    if (c.cho && c.jung && c.jong) {
      // 종성 reassignment: last final consonant moves to the next syllable's 초성
      const split = JONG_SPLIT[c.jong];
      let stay: string | null;
      let moved: string;
      if (split) {
        stay = split[0];
        moved = split[1];
      } else {
        stay = null;
        moved = c.jong;
      }
      const cur: Comp = { cho: c.cho, jung: c.jung, jong: stay };
      return { display: compose(cur), advance: true, next: { cho: moved, jung: jamo, jong: null } };
    }
    // bare vowel into an empty cell
    c.jung = jamo;
    return { display: compose(c), advance: false, next: c };
  }

  if (isCho(jamo)) {
    if (!c.cho && !c.jung) {
      c.cho = jamo;
      return { display: compose(c), advance: false, next: c };
    }
    if (c.cho && !c.jung) {
      // two leading consonants with no vowel -> commit the first, start anew
      return { display: compose(c), advance: true, next: { cho: jamo, jung: null, jong: null } };
    }
    if (c.cho && c.jung && !c.jong) {
      if (isJong(jamo)) {
        c.jong = jamo;
        return { display: compose(c), advance: false, next: c };
      }
      return { display: compose(c), advance: true, next: { cho: jamo, jung: null, jong: null } };
    }
    if (c.cho && c.jung && c.jong) {
      const combo = JONG_COMBO[c.jong + jamo];
      if (combo) {
        c.jong = combo;
        return { display: compose(c), advance: false, next: c };
      }
      return { display: compose(c), advance: true, next: { cho: jamo, jung: null, jong: null } };
    }
  }

  // unknown char — ignore, keep state
  return { display: compose(c), advance: false, next: c };
}

export const isHangulJamo = (ch: string) => isVowel(ch) || isCho(ch);
