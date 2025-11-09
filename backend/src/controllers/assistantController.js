// import fetch from "node-fetch";
// import dotenv from "dotenv";
// import { readFileSync, existsSync } from "fs";
// import { join, dirname } from "path";
// import { fileURLToPath } from "url";

// dotenv.config();

// const __dirname = dirname(fileURLToPath(import.meta.url));

// // Path to campus file
// const campusFilePath = join(__dirname, "../../../frontend/Campus_Building_Details.txt");

// // Check if file exists and read
// let campusText = "";
// if (existsSync(campusFilePath)) {
//   campusText = readFileSync(campusFilePath, "utf-8");
//   console.log("✅ Campus file loaded successfully.");
// } else {
//   console.warn("⚠️ Campus_Building_Details.txt not found at:", campusFilePath);
// }

// const GEMINI_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";


// export async function ask(req, res) {
//   const { q } = req.query;
//   if (!q || !q.trim()) {
//     return res.status(400).json({ reply: "Missing question." });
//   }

//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     return res.status(500).json({ reply: "Missing GEMINI_API_KEY in backend." });
//   }

//   const lowerQ = q.toLowerCase();
//   const isCampusQuery =
//     lowerQ.includes("campus") ||
//     lowerQ.includes("building") ||
//     lowerQ.includes("department") ||
//     lowerQ.includes("library") ||
//     lowerQ.includes("canteen") ||
//     lowerQ.includes("hostel") ||
//     lowerQ.includes("bhavan") ||
//     lowerQ.includes("college") ||
//     lowerQ.includes("lab");

//   // Adjusted prompt
//   const prompt = isCampusQuery && campusText.trim().length > 0
//     ? `
// You are an AI campus assistant for the National Institute of Engineering, Mysore.

// Here is the official campus information:
// ---
// ${campusText}
// ---

// Answer this question based on the above details.
// If relevant, mention the building name or facilities.
// If you truly cannot find any matching info, then say:
// "I could not find this in the campus records."

// Question: "${q}"
// `
//     : `You are a friendly AI assistant. Respond naturally and helpfully to this message: "${q}"`;

//   try {
//     const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }],
//       }),
//     });

//     const data = await response.json();

//     // Log response structure for debugging
//     console.log("Gemini raw response:", JSON.stringify(data, null, 2));

//     const answer =
//       data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//       data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text ||
//       "I could not find this in the campus records.";

//     res.json({ reply: answer });
//   } catch (error) {
//     console.error("Gemini API error:", error);
//     res.status(500).json({
//       reply: "Failed to contact Gemini API. Try again later.",
//     });
//   }
// }



// controllers/assistantController.js
import fetch from "node-fetch";
import dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const campusFilePath = join(__dirname, "../../../frontend/Campus_Building_Details.txt");

let campusText = "";
if (existsSync(campusFilePath)) {
  campusText = readFileSync(campusFilePath, "utf-8");
  console.log("✅ Campus file loaded successfully.");
} else {
  console.warn("⚠️ Campus_Building_Details.txt not found at:", campusFilePath);
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// In-memory chat history
let conversationHistory = [];

// Function to call Gemini API
async function callGemini(apiKey, prompt) {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await response.json();
  const answer =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text ||
    null;

  return answer;
}

export async function ask(req, res) {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ reply: "Missing question." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: "Missing GEMINI_API_KEY in backend." });
  }

  try {
    // 🧠 1. Ask Gemini to classify the intent
    const classifierPrompt = `
Classify the following question into one of these categories:
- "campus" if it asks about buildings, facilities, departments, hostels, library, or college locations.
- "general" if it's about greetings, conversation, or other topics.

Question: "${q}"

Only respond with one word: campus or general.
`;

    const classification = await callGemini(apiKey, classifierPrompt);
    const intent = classification?.toLowerCase().includes("campus") ? "campus" : "general";

    // 💬 2. Add the current question to conversation memory
    conversationHistory.push({ role: "user", text: q });
    if (conversationHistory.length > 6) conversationHistory.shift(); // keep last 6 exchanges

    // 🧠 3. Build contextual prompt
    let prompt;
    if (intent === "campus") {
      prompt = `
You are an AI campus assistant for the National Institute of Engineering, Mysore.

Here is the official campus information:
---
${campusText}
---

Recent conversation history:
${conversationHistory.map(m => `${m.role}: ${m.text}`).join("\n")}

Use only the campus information above to answer the following question:
"${q}"

If you cannot find relevant info, say: "I could not find this in the campus records."
`;
    } else {
      prompt = `
You are a friendly, helpful AI assistant. Continue the conversation naturally.

Recent conversation history:
${conversationHistory.map(m => `${m.role}: ${m.text}`).join("\n")}

User: "${q}"
`;
    }

    // 🧩 4. Get Gemini’s response
    const aiReply = await callGemini(apiKey, prompt);

    // Add Gemini's reply to memory
    conversationHistory.push({ role: "assistant", text: aiReply });

    // 🧹 Trim to last 6 messages
    if (conversationHistory.length > 6) conversationHistory = conversationHistory.slice(-6);

    // Extract buildings mentioned in the response for structured data
    const mentionedBuildings = [];
    const buildingNames = [
      // Main Academic Buildings
      'Ramanujacharya Bhavan',
      'Madhavacharya Bhavan', 
      'Shankaracharya Bhavan',
      'Main Building',
      'Central Library',
      'Library',
      
      // Hostels and Accommodation
      'Boys Hostel',
      'Girls Hostel',
      'Hostel',
      
      // Food and Dining
      'Food Court',
      'Canteen',
      'Canteen - Gopi\'s Kitchen',
      'Bakery and Cake',
      'Coffee Shop',
      
      // Sports and Recreation
      'Gym',
      'Sports Complex',
      'Auditorium',
      'Seminar Hall',
      
      // Facilities and Services
      'Parking',
      'Main Gate',
      'Training & Placement Cell',
      'T&P Cell',
      
      // Academic Departments and Labs
      'Department of Computer Science and Engineering',
      'CSE Department',
      'Department of Information Science and Engineering',
      'ISE Department',
      'Department of MCA',
      'MCA Department',
      'Department of Mechanical Engineering',
      'Mechanical Department',
      'Department of Physics',
      'Physics Department',
      'Department of Mathematics',
      'Mathematics Department',
      
      // Specific Labs
      'AIML Labs',
      'AIML Lab 1',
      'AIML Lab 2',
      'AIML Lab 3',
      'AIML Lab 4',
      'MCA Labs',
      'MCA Lab 1',
      'MCA Lab 2',
      'MCA Lab 3',
      'CSE Labs',
      'CSE Lab 1',
      'CSE Lab 2',
      'CSE Lab 3',
      'CSE Lab 4',
      'CSE Lab 5',
      'CSE Lab 6',
      'CSE Lab 7',
      'CSE Lab 8',
      'IS Labs',
      'IS Lab 1',
      'IS Lab 2',
      'IS Lab 3',
      'IS Lab 4',
      'IS Lab 5',
      'IS Lab 6',
      'IS Lab 7',
      'IS Lab 8',
      'CAED Lab',
      'Chemistry Laboratory',
      'Chemistry Lab',
      
      // Classrooms and Rooms
      'MB1', 'MB2', 'MB3', 'MB4', 'MB5',
      'Principal\'s Room',
      'Vice Principal\'s Room',
      'College Office',
      'Boardroom',
      'Autonomous Cell',
      'Exam Control Room',
      'Reading Rooms',
      'Staff Room',
      'CSE Staff Room 1',
      'CSE Staff Room 2',
      'ISE Staff Room 1',
      'ISE Staff Room 2',
      'Gents Staff Room',
      'General Staff Room',
      'IT Cell'
    ];
    
    buildingNames.forEach(building => {
      const regex = new RegExp(`\\b${building}\\b`, 'gi');
      if (aiReply && aiReply.match(regex)) {
        mentionedBuildings.push(building);
      }
    });

    res.json({ 
      reply: aiReply || "I could not generate a response.",
      buildings: mentionedBuildings.length > 0 ? mentionedBuildings : undefined
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      reply: "Failed to contact the Gemini API. Try again later.",
    });
  }
}
