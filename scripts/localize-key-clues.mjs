import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("src/data/puzzles.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const localizations = {
  "stray-kids/ate/ATE": "앨범 제목이자, '완전 해냈다'는 뉘앙스로 쓰이는 슬랭은?",
  "stray-kids/ate/CONFIDENCE": "ATE 전체를 관통하는 핵심 감정은?",
  "stray-kids/ate/DOMINATE": "ATE라는 제목이 뻗어 나온 더 긴 영어 동사는?",
  "stray-kids/rock-star/SOCIAL": "LiSA 피처링 수록곡 '___ Path'의 첫 단어는?",
  "stray-kids/rock-star/COMFLEX": "ROCK-STAR 4번 트랙, 콤플렉스를 비트는 말장난 제목의 수록곡은?",
  "stray-kids/rock-star/ROCK": "앨범 제목 속 樂이 동시에 떠올리게 하는 영어 단어는?",
  "stray-kids/rock-star/LISA": "'Social Path'에 피처링한 일본 록 보컬의 이름은?",
  "stray-kids/rock-star/JOY": "한자 樂이 뜻하는 감정, 결국 SKZ가 택하라고 말하는 것은?",
  "stray-kids/rock-star/COVER": "'___ Me'로 이어지는 5번 트랙 제목의 첫 단어는?",
  "stray-kids/rock-star/LEAVE": "ROCK-STAR의 6번 트랙, 담담한 한 단어 제목은?",
  "stray-kids/rock-star/LALALALA": "ROCK-STAR의 타이틀곡이자, '락(樂)' 표기를 함께 쓰는 곡은?",
  "stray-kids/rock-star/MEGAVERSE": "ROCK-STAR의 문을 여는 1번 트랙은?",

  "enhypen/romance-untold/ROMANCE": "이번 앨범이 새로 여는 시리즈 '___ : UNTOLD'의 첫 단어는?",
  "enhypen/romance-untold/HIGHWAY": "'___ 1009'로 이어지는 8번 트랙 제목의 첫 단어는?",
  "enhypen/romance-untold/JVKE": "타이틀곡 영어 버전에 참여한 미국 싱어송라이터의 이름은?",
  "enhypen/romance-untold/XO": "타이틀곡 'XO (Only If You Say Yes)'의 맨 앞 두 글자는?",
  "enhypen/romance-untold/MOON": "'Moonstruck'를 떠올리게 하는 천체이자, DARK ___ 서사의 한 축은?",
  "enhypen/dark-blood/VAMPIRE": "DARK BLOOD 전체를 끌고 가는 초자연적 존재 콘셉트는?",
  "enhypen/dark-blood/KARMA": "DARK BLOOD를 닫는 6번 트랙은?",
  "enhypen/dark-blood/BITE": "타이틀곡 '___ Me'의 첫 단어는?",
  "enhypen/dark-blood/BILLS": "DARK BLOOD의 5번 트랙 한 단어 제목은?",
  "enhypen/dark-blood/SACRIFICE": "'___ (Eat Me Up)'로 이어지는 3번 트랙 제목의 첫 단어는?",
  "enhypen/dark-blood/CHACONNE": "바로크 춤곡 이름을 가져온 4번 트랙은?",
  "enhypen/dark-blood/FATE": "DARK BLOOD의 시작을 여는 1번 트랙은?",
  "enhypen/dark-blood/MOON": "ENHYPEN 세계관 웹툰 제목 'DARK ___: The Blood Altar'의 빈칸은?",
  "enhypen/dark-blood/SUNGHOON": "피겨 스케이팅 선수 출신으로 유명한 ENHYPEN 멤버는?",

  "txt/star-chapter-sanctuary/WINKS": "'Forty One ___'로 이어지는 5번 트랙 제목의 마지막 단어는?",
  "txt/star-chapter-sanctuary/MOON": "타이틀곡 'Over The ___'의 빈칸을 채우는 단어는?",
  "txt/star-chapter-sanctuary/RESIST": "'___ (Not Gonna Run Away)'로 이어지는 4번 트랙 제목의 첫 단어는?",
  "txt/star-chapter-sanctuary/HIGHER": "'___ than Heaven'으로 이어지는 6번 트랙 제목의 첫 단어는?",
  "txt/minisode3-tomorrow/KILLA": "'The ___ (I Belong to You)'로 이어지는 5번 트랙 제목의 핵심 단어는?",
  "txt/minisode3-tomorrow/ANEMOIA": "Deja Vu 리믹스 버전에 붙은, 경험하지 못한 시대를 그리워하는 감정을 뜻하는 조어는?",
  "txt/minisode3-tomorrow/HOPE": "'너와 함께하는 내일'이 이 미니소드에서 상징하는 감정은?",
  "txt/minisode3-tomorrow/FOX": "잊어버린 약속을 떠올리게 하는 어린왕자 속 사막 ___은?",
  "txt/minisode3-tomorrow/MIRACLE": "minisode 3: TOMORROW의 4번 트랙은?",
  "txt/minisode3-tomorrow/TOMORROW": "앨범 제목의 핵심 단어이자 'I'll See You There ___'를 완성하는 말은?",
  "txt/minisode3-tomorrow/MORSE": "2번 트랙 제목은 ___ code로 'tomorrow'를 적는다.",
  "txt/minisode3-tomorrow/BEOMGYU": "기타를 사랑하는 TXT의 분위기 메이커는?",
  "txt/minisode3-tomorrow/PROMISE": "소년이 다시 떠올리고 지키러 가는 잊힌 것은 바로 이 ___이다.",
  "txt/minisode3-tomorrow/QUARTER": "'___ Life'로 이어지는 6번 트랙 제목의 첫 단어는?",

  "ateez/golden-hour-part1/NOSTALGIA": "이 EP 전반에 흐르는, 지난 시간을 그리워하는 감정은?",
  "ateez/golden-hour-part1/HERO": "ATEEZ 세계관에서 한때 멤버들이었던 존재를 가리키는 단어는?",
  "ateez/golden-hour-part1/ENDURANCE": "고든아워를 버텨내며 증명하는 태도, 즉 ___를 뜻하는 단어는?",
  "ateez/golden-hour-part1/DREAM": "서사 속에서 멤버들이 취해 있는 대상, 'it takes money to ___'의 빈칸은?",
  "ateez/golden-hour-part1/HOUR": "앨범 제목 GOLDEN ___의 두 번째 단어는?",
  "ateez/golden-hour-part1/GOLDEN": "앨범 제목의 첫 단어이자, 1분 24초 인트로 제목의 핵심 단어는?",

  "riize/riizing/RIIZING": "RIIZE가 상승 중임을 그대로 드러내는 EP 제목은?",
  "riize/riizing/YOUTH": "타이틀곡이 노래하는 인생의 시기는 바로 이 단어다.",
  "riize/riizing/GUITAR": "RIIZE의 선공개·데뷔 초반 대표곡 'Get a ___'의 빈칸은?",
  "riize/riizing/BOOM": "'___ ___ Bass'처럼 두 번 반복되는 타이틀곡 제목의 첫 단어는?",
  "riize/riizing/BASS": "타이틀곡 'Boom Boom ___'를 완성하는 저음 악기 이름은?",
  "riize/riizing/KISS": "'One ___'로 이어지는 6번 트랙 제목의 마지막 단어는?",

  "zerobaseone/you-had-me-at-hello/FEEL": "타이틀곡 '___ the POP'의 첫 단어는?",
  "zerobaseone/you-had-me-at-hello/SUMMER": "이 EP가 불러오는 계절감, 티저 필름 제목 '___ Came Early'의 빈칸은?",
  "zerobaseone/you-had-me-at-hello/HELLO": "앨범 제목의 마지막 단어이자, Young K가 작사한 수록 발라드 제목은?",
  "zerobaseone/you-had-me-at-hello/SOLAR": "'___ Power'로 이어지는 오프닝 트랙 제목의 첫 단어는?",
};

let changed = 0;
for (const artist of data.artists) {
  for (const album of artist.albums) {
    for (const entry of album.entries) {
      const key = `${artist.id}/${album.id}/${entry.answer}`;
      const clueKo = localizations[key];
      if (!clueKo) continue;
      entry.clueKo = clueKo;
      changed += 1;
    }
  }
}

writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`localized ${changed} clues in ${file}`);
