// Tiny rule-based Q&A engine for campus knowledge
const knowledge = `
Ramanujacharya Bhavan (Classroom Building)
- Main entrance: North side
- Stairs: Central, all floors + basement
- RO water: South-West corner of basement
- Basement: Chemistry Lab, Staff Room
- Washrooms: every floor – Boys NE, Girls NW
- Ground Floor: Principal Room (South), Vice Principal (South), Dean Office (SW), Board Room(SW), Exam Control Room (NE), Office (South), Boardroom & Autonomous Cell (SW), Exam Control (West)
- First Floor: ISE Dept/ISE HOD Office (SW), Physics Dept/Physics HOD Office (NW), CSE Dept/CSE HOD Office (NW)
- Second Floor: Mathematics Dept/Mathematics HOD Office (NW)
- Third Floor: Mechanical Dept/Mechanical HOD Office (SW), Mathematics Staff Room (NW)

Madhavacharya Bhavan (Library Building)
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
- Ground Floor: Infirmary for first aid (NW), TPO Office/T&P Cells (NW), Coffee Shop (West), Seminar Hall (Central), Auditorium (East), Boys washroom SW, Girls SE, Admission Cell (West)
- First Floor: AIML Labs 1-4, MCA Dept (West), MCA Labs 1-3, ISE & IT Cell (West), CSE Staff Room 1 (SE)
- Second Floor: CSE Staff Room 2 (North), Gents Staff Room (West), CSE Labs 1-8 (Lab 6 = CAED Lab)
- Third Floor: ISE Staff Room 2 (North), IS Labs 1-8

Canteen - Gopi's Kitchen
- Also called Day Scholar's Canteen/ Day Scholar's Mess/ Day Scholar Sitting Area
- Cooked food available

Food Court (College Mess)
- It is the combined mess for both Girls' Hostel and Boys' Hostel
- It is located near the main entrance
- It also has a bakery outside it
- Students from south campus hostels can have their meals here as well
- Day scholars can pay 50rs and have a meal here too

Bakery and Cake (Coca Cola Canteen)
- In the area between the Shankaracharya Bhavan and the Ramanujacharya Bhavan
- It is next to the shed of bike parking

Parking 
- Combined parking for all vehicles
`;

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/);
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
  if (!question)
    return "Please ask something about campus buildings, labs, rooms, or facilities.";
  const q = normalize(question);
  const lines = knowledge.split("\n").filter((l) => l.trim());

  // Find the best matching building/entity first
  let bestBuilding = null,
    bestBuildingScore = 0;

  // Check for building names first (lines without leading "-")
  for (const line of lines) {
    if (!line.startsWith("-")) {
      const s = score(line, q);
      if (s > bestBuildingScore) {
        bestBuildingScore = s;
        bestBuilding = line;
      }
    }
  }

  // If we found a building, collect all related lines (details)
  if (bestBuilding && bestBuildingScore >= 1) {
    const buildingIndex = lines.indexOf(bestBuilding);
    const relatedLines = [bestBuilding];

    // Collect all lines that belong to this building (lines starting with "-" after the building name)
    for (let i = buildingIndex + 1; i < lines.length; i++) {
      if (lines[i].startsWith("-")) {
        relatedLines.push(lines[i]);
      } else {
        // Stop when we hit another building
        break;
      }
    }

    // Filter related lines that match the question
    const matchingLines = relatedLines.filter((line) => {
      const lineScore = score(line, q);
      return lineScore > 0;
    });

    // If we have matching details, return them
    if (matchingLines.length > 1) {
      return matchingLines.map((line) => line.replace(/^-\s*/, "")).join("\n");
    }

    // Otherwise return the building and all its details
    return relatedLines.map((line) => line.replace(/^-\s*/, "")).join("\n");
  }

  // Fallback: find best matching line overall
  let best = null,
    bestScore = 0;
  for (const line of lines) {
    const s = score(line, q);
    if (s > bestScore) {
      bestScore = s;
      best = line;
    }
  }

  if (!best || bestScore < 1) {
    return "I could not find an answer in the campus data. Try rephrasing or ask about specific buildings, labs, or rooms.";
  }

  return best.replace(/^-\s*/, ""); // remove leading bullet
}
