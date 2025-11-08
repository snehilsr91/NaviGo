// Tiny rule-based Q&A engine for campus knowledge
const knowledge = `
Ramanujacharya Bhavan (Classroom Building)
- Main entrance: North side
- Stairs: Central, all floors + basement
- RO water: South-West corner of basement
- Basement: Chemistry Lab, Staff Room
- Washrooms: every floor – Boys NE, Girls NW
- Ground Floor: Principal Room (South), Vice Principal (South), Office (South), Boardroom & Autonomous Cell (SW), Exam Control (West)
- First Floor: ISE Dept (SW), Physics Dept (NW), CSE Dept (NW)
- Second Floor: Mathematics Dept (NW)
- Third Floor: Mechanical Dept (SW), Staff Room (NW)

Madhavacharya Bhavan (Library Building)
- Main entrance: North side
- Stairs: Central, to first floor & basement
- Basement: Staff Room, Washrooms (both North)
- Washrooms: Girls beside Library (North), Boys East side
- Library: North side
- Classrooms: MB1-MB5, ~60 students each

Shankaracharya Bhavan (Lab Building)
- Main entrance: North side
- Lift: West side
- Stairs: South side, all floors
- Water dispensers: South-East corner
- Stationery shop: South side near stairs
- Ground Floor: T&P Cell (NW), Coffee Shop (West), Seminar Hall (Central), Auditorium (East), Boys washroom SW, Girls SE
- First Floor: AIML Labs 1-4, MCA Dept (West), MCA Labs 1-3, ISE & IT Cell (West), CSE Staff Room 1 (SE)
- Second Floor: CSE Staff Room 2 (North), Gents Staff Room (West), CSE Labs 1-8 (Lab 6 = CAED Lab)
- Third Floor: ISE Staff Room 2 (North), IS Labs 1-8
`;

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
}

function score(passage, questionWords) {
  const passWords = normalize(passage);
  let hits = 0;
  for (const w of questionWords) {
    if (passWords.includes(w)) hits++;
  }
  return hits;
}

export function askCampus(question) {
  if (!question) return 'Please ask something about campus buildings, labs, rooms, or facilities.';
  const q = normalize(question);
  const lines = knowledge.split('\n').filter(l => l.trim());
  let best = null, bestScore = 0;
  for (const line of lines) {
    const s = score(line, q);
    if (s > bestScore) {
      bestScore = s;
      best = line;
    }
  }
  if (!best || bestScore < 1) {
    return 'I could not find an answer in the campus data. Try rephrasing or ask about specific buildings, labs, or rooms.';
  }
  return best.replace(/^-\s*/, ''); // remove leading bullet
}