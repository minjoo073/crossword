import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("src/data/puzzles.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const replacements = {
  "stray-kids/ate/NACHIMBONG": {
    clue: "Stray Kids' official lightstick waved all through the ATE era.",
    clueKo: "ATE의 자신감 넘치는 무대 앞 객석에서 함께 흔드는 스트레이 키즈 공식 응원봉은?",
  },
  "stray-kids/ate/EIGHT": {
    clue: "The number that completes the ATE title pun and matches SKZ's member count.",
    clueKo: "ATE라는 제목의 발음 장난을 완성하면서 현재 멤버 수와도 맞아떨어지는 숫자는?",
  },
  "stray-kids/ate/JYP": {
    clue: "The three-letter company that released ATE.",
    clueKo: "ATE를 발매한 스트레이 키즈의 세 글자 소속사는?",
  },
  "stray-kids/ate/STAY": {
    clue: "The fandom cheering on Stray Kids through the ATE promotions.",
    clueKo: "ATE 활동기에도 객석을 채운 스트레이 키즈 팬덤 이름은?",
  },
  "stray-kids/ate/BANGCHAN": {
    clue: "The leader steering ATE's bold, self-assured era.",
    clueKo: "Chk Chk Boom과 ATE의 자신감 서사를 중심에서 이끈 스트레이 키즈의 리더는?",
  },
  "stray-kids/rock-star/BANGCHAN": {
    clue: "The leader fronting Stray Kids through the ROCK-STAR era.",
    clueKo: "LALALALA와 ROCK-STAR의 록 에너지를 앞에서 끌고 간 스트레이 키즈의 리더는?",
  },
  "stray-kids/rock-star/NACHIMBONG": {
    clue: "The official lightstick raised during ROCK-STAR concerts and stages.",
    clueKo: "ROCK-STAR 활동 때도 함께 흔든 스트레이 키즈 공식 응원봉은?",
  },
  "stray-kids/rock-star/STAY": {
    clue: "The fandom name heard all through the ROCK-STAR comeback.",
    clueKo: "ROCK-STAR 컴백을 함께 달린 스트레이 키즈 팬덤 이름은?",
  },
  "enhypen/romance-untold/ENGINEBONG": {
    clue: "ENHYPEN's official lightstick seen throughout ROMANCE : UNTOLD promotions.",
    clueKo: "ROMANCE : UNTOLD 활동을 비춘 ENHYPEN 공식 응원봉 이름은?",
  },
  "enhypen/romance-untold/JUNGWON": {
    clue: "The leader carrying ENHYPEN through the ROMANCE : UNTOLD era.",
    clueKo: "XO와 Moonstruck로 이어지는 ROMANCE : UNTOLD 시대를 이끈 ENHYPEN의 리더는?",
  },
  "enhypen/romance-untold/ENGENE": {
    clue: "The fandom name supporting ENHYPEN through ROMANCE : UNTOLD.",
    clueKo: "ROMANCE : UNTOLD 활동을 함께한 ENHYPEN 팬덤 이름은?",
  },
  "enhypen/dark-blood/ENGENE": {
    clue: "The fandom that followed ENHYPEN into the DARK BLOOD era.",
    clueKo: "DARK BLOOD 시기를 함께 건넌 ENHYPEN 팬덤 이름은?",
  },
  "txt/star-chapter-sanctuary/MOABONG": {
    clue: "TXT's official lightstick shining through SANCTUARY promotions.",
    clueKo: "SANCTUARY 활동 무대와 객석을 함께 밝힌 TXT 공식 응원봉은?",
  },
  "txt/star-chapter-sanctuary/MOA": {
    clue: "TXT's fandom name, standing with them through SANCTUARY.",
    clueKo: "Over The Moon과 Heaven, Danger가 실린 SANCTUARY 시대를 함께 건넌 TXT 팬덤 이름은?",
  },
  "txt/star-chapter-sanctuary/SOOBIN": {
    clue: "The leader guiding TXT through the SANCTUARY era.",
    clueKo: "별의 언어와 성역 서사를 내세운 SANCTUARY 활동기를 이끈 TXT의 리더는?",
  },
  "txt/star-chapter-sanctuary/BIGHIT": {
    clue: "The label that released The Star Chapter: SANCTUARY.",
    clueKo: "The Star Chapter: SANCTUARY를 발매한 TXT의 레이블은?",
  },
  "txt/minisode3-tomorrow/MOA": {
    clue: "TXT's fandom name, waiting with them for TOMORROW.",
    clueKo: "Deja Vu와 I'll See You There Tomorrow를 함께 따라간 minisode 3: TOMORROW 시대의 TXT 팬덤 이름은?",
  },
  "txt/minisode3-tomorrow/MOABONG": {
    clue: "TXT's official lightstick seen throughout TOMORROW promotions.",
    clueKo: "minisode 3: TOMORROW 활동 때도 함께 보인 TXT 공식 응원봉은?",
  },
  "ateez/golden-hour-part1/ATINY": {
    clue: "ATEEZ's fandom name, right beside them in GOLDEN HOUR : Part.1.",
    clueKo: "WORK와 Shaboom, Blind가 실린 GOLDEN HOUR : Part.1 활동을 함께한 ATEEZ 팬덤 이름은?",
  },
  "ateez/golden-hour-part1/HONGJOONG": {
    clue: "The captain leading ATEEZ through WORK and the first GOLDEN HOUR.",
    clueKo: "WORK와 첫 GOLDEN HOUR 시대를 통째로 이끈 ATEEZ의 캡틴은?",
  },
  "ateez/golden-hour-part2/SEONGHWA": {
    clue: "ATEEZ's eldest member, returning in the cooler Part.2 chapter.",
    clueKo: "Ice On My Teeth로 한층 차가워진 Part.2 무드 속에서도 존재감을 드러낸 ATEEZ의 맏형은?",
  },
  "riize/riizing/ANTON": {
    clue: "RIIZE's youngest member, present through the RIIZING era.",
    clueKo: "Boom Boom Bass와 Impossible로 이어진 RIIZING 활동기를 함께한 RIIZE의 막내는?",
  },
  "riize/riizing/BRIIZE": {
    clue: "RIIZE's fandom name, blowing through the RIIZING comeback.",
    clueKo: "RIIZING 컴백을 함께 달린 RIIZE 팬덤 이름은?",
  },
  "riize/odyssey/SUNGCHAN": {
    clue: "The tall member helping RIIZE set off on ODYSSEY.",
    clueKo: "Fly Up으로 시작하는 ODYSSEY의 출항을 함께한 RIIZE의 장신 멤버는?",
  },
  "boynextdoor/nineteen-ninetynine/TAESAN": {
    clue: "The member-producer whose touch helps shape 19.99.",
    clueKo: "Nice Guy와 Dangerous가 담긴 19.99의 결을 만드는 데 참여한 BOYNEXTDOOR 멤버 프로듀서는?",
  },
  "boynextdoor/nineteen-ninetynine/KOZ": {
    clue: "The label that released BOYNEXTDOOR's 19.99.",
    clueKo: "19.99를 발매한 BOYNEXTDOOR의 소속 레이블은?",
  },
  "boynextdoor/nineteen-ninetynine/ONEDOOR": {
    clue: "BOYNEXTDOOR's fandom name, standing with them for 19.99.",
    clueKo: "19.99 시대를 함께한 BOYNEXTDOOR 팬덤 이름은?",
  },
  "boynextdoor/how/WOONHAK": {
    clue: "BOYNEXTDOOR's youngest member during the HOW? era.",
    clueKo: "Earth, Wind & Fire로 달린 HOW? 활동기의 BOYNEXTDOOR 막내는?",
  },
  "zerobaseone/you-had-me-at-hello/WAKEONE": {
    clue: "The company behind ZEROBASEONE's You had me at HELLO.",
    clueKo: "You had me at HELLO를 발매한 ZEROBASEONE의 소속사는?",
  },
  "zerobaseone/you-had-me-at-hello/ZEROSE": {
    clue: "ZEROBASEONE's fandom name, blooming beside this HELLO era.",
    clueKo: "You had me at HELLO 활동을 함께한 ZEROBASEONE 팬덤 이름은?",
  },
  "zerobaseone/you-had-me-at-hello/MATTHEW": {
    clue: "The member smiling through this bright HELLO-era comeback.",
    clueKo: "Feel the POP과 Sweat로 이어지는 You had me at HELLO의 밝은 무드 속에서도 눈에 띄는 멤버는?",
  },
  "zerobaseone/you-had-me-at-hello/HANBIN": {
    clue: "The leader carrying ZEROBASEONE through You had me at HELLO.",
    clueKo: "Feel the POP 컴백과 You had me at HELLO 활동기를 이끈 ZEROBASEONE의 리더는?",
  },
  "zerobaseone/cinema-paradise/ZEROSE": {
    clue: "ZEROBASEONE's fandom name, invited into CINEMA PARADISE.",
    clueKo: "CINEMA PARADISE 상영회에 함께 입장한 ZEROBASEONE 팬덤 이름은?",
  },
  "zerobaseone/cinema-paradise/HANBIN": {
    clue: "The leader at the center of ZEROBASEONE's CINEMA PARADISE era.",
    clueKo: "Good So Bad와 CINEMA PARADISE 활동의 중심에 선 ZEROBASEONE 리더는?",
  },
  "tws/summer-beat/DOHOON": {
    clue: "The '-hoon' member in TWS's SUMMER BEAT! lineup who is not Jihoon.",
    clueKo: "Double Take와 Fire Confetti가 실린 SUMMER BEAT! 라인업에서 지훈과 헷갈리기 쉬운 '-훈' 멤버는?",
  },
  "tws/summer-beat/SHINYU": {
    clue: "The leader heading TWS through SUMMER BEAT! promotions.",
    clueKo: "내가 S면 넌 나의 N이라 노래한 SUMMER BEAT! 활동을 이끈 TWS의 리더는?",
  },
  "tws/summer-beat/PLEDIS": {
    clue: "The label that released TWS's SUMMER BEAT!.",
    clueKo: "SUMMER BEAT!를 발매한 TWS의 소속 레이블은?",
  },
  "tws/sparkling-blue/PLEDIS": {
    clue: "The label behind TWS's debut mini Sparkling Blue.",
    clueKo: "Sparkling Blue를 발매한 TWS의 소속 레이블은?",
  },
  "tws/sparkling-blue/SHINYU": {
    clue: "The leader guiding TWS through the Sparkling Blue debut era.",
    clueKo: "첫 만남은 계획대로 되지 않아로 시작한 Sparkling Blue 데뷔 활동기를 이끈 TWS의 리더는?",
  },
  "plave/caligo-pt1/VLAST": {
    clue: "The company behind PLAVE's Caligo Pt.1 release.",
    clueKo: "Dash와 RIZZ가 실린 Caligo Pt.1을 선보인 PLAVE의 제작사 이름은?",
  },
  "plave/asterum-134-1/VLAST": {
    clue: "The studio behind PLAVE's ASTERUM : 134-1.",
    clueKo: "WAY 4 LUV가 타이틀인 ASTERUM : 134-1을 만든 PLAVE의 제작사는?",
  },
  "nct-wish/steady/SION": {
    clue: "The leader steering NCT WISH through the Steady era.",
    clueKo: "Steady와 Dunk Shot으로 이어진 활동기를 이끈 NCT WISH의 리더는?",
  },
  "nct-wish/steady/SAKUYA": {
    clue: "The youngest member appearing in NCT WISH's Steady era.",
    clueKo: "Steady 활동기의 NCT WISH 막내는?",
  },
  "nct-wish/color/YUSHI": {
    clue: "The member adding his voice to NCT WISH's COLOR era.",
    clueKo: "poppop 이후 COLOR 활동에서도 존재감을 드러낸 NCT WISH 멤버는?",
  },
  "nct-wish/color/RYO": {
    clue: "The short-named member in NCT WISH's COLOR lineup.",
    clueKo: "COLOR 활동기의 NCT WISH 라인업 중 이름이 가장 짧은 멤버는?",
  },
  "le-sserafim/crazy/SAKURA": {
    clue: "The member helping drive LE SSERAFIM's CRAZY era with fearless poise.",
    clueKo: "Pierrot와 Chasing Lightning가 깔린 CRAZY 활동기의 대담한 무드를 함께 완성한 LE SSERAFIM 멤버는?",
  },
  "le-sserafim/crazy/SOURCE": {
    clue: "The label that released LE SSERAFIM's CRAZY.",
    clueKo: "CRAZY를 발매한 LE SSERAFIM의 소속 레이블은?",
  },
  "le-sserafim/crazy/CHAEWON": {
    clue: "The leader guiding LE SSERAFIM through CRAZY.",
    clueKo: "CRAZY와 Crazier로 이어진 활동기를 이끈 LE SSERAFIM의 리더는?",
  },
  "le-sserafim/crazy/FEARNOT": {
    clue: "LE SSERAFIM's fandom name, dancing through the CRAZY era.",
    clueKo: "CRAZY 활동을 함께 달린 LE SSERAFIM 팬덤 이름은?",
  },
  "le-sserafim/crazy/PIMBONG": {
    clue: "LE SSERAFIM's official lightstick seen across CRAZY stages.",
    clueKo: "CRAZY 무대와 객석을 함께 밝힌 LE SSERAFIM 공식 응원봉 이름은?",
  },
  "le-sserafim/crazy/HYBE": {
    clue: "The parent company above Source Music for CRAZY's release.",
    clueKo: "CRAZY를 낸 Source Music의 상위 모회사 이름은?",
  },
  "le-sserafim/unforgiven/FEARNOT": {
    clue: "The fandom name that also appears in an UNFORGIVEN track title.",
    clueKo: "UNFORGIVEN 수록곡 제목에도 직접 등장하는 LE SSERAFIM 팬덤 이름은?",
  },
  "le-sserafim/unforgiven/CHAEWON": {
    clue: "The leader at the front of LE SSERAFIM's UNFORGIVEN era.",
    clueKo: "UNFORGIVEN 활동기의 LE SSERAFIM 리더는?",
  },
  "ive/ive-empathy/STARSHIP": {
    clue: "The company that released IVE EMPATHY.",
    clueKo: "IVE EMPATHY를 발매한 IVE의 소속사는?",
  },
  "ive/ive-empathy/DIVE": {
    clue: "IVE's fandom name, right there for IVE EMPATHY.",
    clueKo: "IVE EMPATHY 활동을 함께한 IVE 팬덤 이름은?",
  },
  "ive/ive-empathy/YUJIN": {
    clue: "The leader guiding IVE through the IVE EMPATHY era.",
    clueKo: "Rebel Heart와 ATTITUDE로 이어진 IVE EMPATHY 활동기를 이끈 IVE의 리더는?",
  },
  "ive/ive-ive/GAEUL": {
    clue: "IVE's oldest member during the I've IVE era.",
    clueKo: "Kitsch와 I AM 시기의 I've IVE 활동기에서 IVE 맏언니는 누구일까?",
  },
  "ive/ive-ive/DIVE": {
    clue: "IVE's fandom name, taking the plunge with I've IVE.",
    clueKo: "I've IVE 활동을 함께한 IVE 팬덤 이름은?",
  },
  "ive/ive-ive/LEESEO": {
    clue: "IVE's youngest member during the I've IVE era.",
    clueKo: "I AM으로 폭발한 I've IVE 활동기의 IVE 막내는?",
  },
  "aespa/whiplash/SBONG": {
    clue: "aespa's official lightstick seen during the Whiplash era.",
    clueKo: "Whiplash 활동 무대와 객석에서 함께 보인 aespa 공식 응원봉 이름은?",
  },
  "aespa/whiplash/KARINA": {
    clue: "The leader at the front of aespa's Whiplash comeback.",
    clueKo: "Whiplash와 Kill It으로 이어진 컴백을 이끈 aespa의 리더는?",
  },
  "illit/super-real-me/YUNAH": {
    clue: "The leader opening ILLIT's SUPER REAL ME era.",
    clueKo: "Magnetic으로 시작된 SUPER REAL ME 활동기를 연 ILLIT의 리더는?",
  },
  "illit/super-real-me/GLLIT": {
    clue: "ILLIT's fandom name, sparkling beside SUPER REAL ME.",
    clueKo: "SUPER REAL ME 활동을 함께한 ILLIT 팬덤 이름은?",
  },
  "illit/super-real-me/IROHA": {
    clue: "ILLIT's youngest member during the SUPER REAL ME debut era.",
    clueKo: "Magnetic으로 데뷔한 SUPER REAL ME 활동기의 ILLIT 막내는?",
  },
  "illit/super-real-me/BELIFT": {
    clue: "The label behind ILLIT's SUPER REAL ME debut.",
    clueKo: "SUPER REAL ME를 발매한 ILLIT의 소속 레이블은?",
  },
  "illit/super-real-me/GLITTER": {
    clue: "The sparkling word that inspired ILLIT's fandom name around SUPER REAL ME.",
    clueKo: "SUPER REAL ME 시기 팬덤명의 영감이 된 반짝이는 영어 단어는?",
  },
  "illit/ill-like-you/MINJU": {
    clue: "The member present throughout I'LL LIKE YOU promotions.",
    clueKo: "Cherish (My Love)로 이어진 I'LL LIKE YOU 활동기에도 함께한 ILLIT 멤버는?",
  },
  "illit/ill-like-you/MOKA": {
    clue: "The Japanese member in ILLIT's I'LL LIKE YOU era.",
    clueKo: "Tick-Tack과 Cherish가 실린 I'LL LIKE YOU 활동기의 일본인 ILLIT 멤버는?",
  },
  "illit/ill-like-you/BELIFT": {
    clue: "The label that released I'LL LIKE YOU.",
    clueKo: "I'LL LIKE YOU를 발매한 ILLIT의 소속 레이블은?",
  },
  "illit/ill-like-you/GLLIT": {
    clue: "ILLIT's fandom name, staying with them for I'LL LIKE YOU.",
    clueKo: "I'LL LIKE YOU 활동을 함께한 ILLIT 팬덤 이름은?",
  },
  "babymonster/drip/MONSTIEZ": {
    clue: "BABYMONSTER's fandom name, roaring through the DRIP era.",
    clueKo: "DRIP와 CLIK CLAK 활동을 함께한 BABYMONSTER 팬덤 이름은?",
  },
  "babymonster/drip/RORA": {
    clue: "The Korean member appearing in BABYMONSTER's DRIP era.",
    clueKo: "DRIP와 Billionaire가 실린 활동기의 BABYMONSTER 한국인 멤버는?",
  },
  "babymonster/drip/RUKA": {
    clue: "The Japanese rapper standing out in BABYMONSTER's DRIP era.",
    clueKo: "DRIP 활동기에도 강한 존재감을 보인 BABYMONSTER의 일본인 래퍼 멤버는?",
  },
  "babymonster/babymons7er/MONSTIEZ": {
    clue: "BABYMONSTER's fandom name, backing the BABYMONS7ER debut era.",
    clueKo: "BABYMONS7ER 활동을 함께한 BABYMONSTER 팬덤 이름은?",
  },
  "babymonster/babymons7er/PHARITA": {
    clue: "The Thai member present in BABYMONS7ER's seven-member rollout.",
    clueKo: "SHEESH와 BATTER UP이 함께 실린 BABYMONS7ER 완전체 활동기의 태국인 멤버는?",
  },
  "babymonster/babymons7er/CHIQUITA": {
    clue: "BABYMONSTER's youngest member during the BABYMONS7ER era.",
    clueKo: "BABYMONS7ER 활동기의 BABYMONSTER 막내는 누구일까?",
  },
  "babymonster/babymons7er/RORA": {
    clue: "The Korean member completing the BABYMONS7ER lineup.",
    clueKo: "Dream과 Stuck In The Middle까지 품은 BABYMONS7ER 라인업을 채운 BABYMONSTER의 한국인 멤버는?",
  },
};

let changed = 0;
for (const artist of data.artists) {
  for (const album of artist.albums) {
    for (const entry of album.entries) {
      const key = `${artist.id}/${album.id}/${entry.answer}`;
      const next = replacements[key];
      if (!next) continue;
      entry.clue = next.clue;
      entry.clueKo = next.clueKo;
      changed += 1;
    }
  }
}

writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`updated ${changed} clues in ${file}`);
