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

// Helper function to enhance "not found" responses with contextual suggestions
function enhanceNotFoundResponse(response, query, campusText) {
  const lowerResponse = response.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Check if response indicates "not found"
  const isNotFound = lowerResponse.includes("could not find") || 
                     lowerResponse.includes("not in the campus records") ||
                     lowerResponse.includes("not found") ||
                     lowerResponse.includes("no information") ||
                     (lowerResponse.includes("i could not") && lowerResponse.length < 100);
  
  if (!isNotFound) {
    return response; // Return original response if it's not a "not found" message
  }
  
  // Detect query type and provide contextual suggestions
  let suggestion = "";
  
  // Food-related queries
  if (lowerQuery.match(/\b(food|eat|meal|snack|breakfast|lunch|dinner|restaurant|cafe|pizza|burger|biryani|dosa|idli|coffee|tea|juice|milkshake|ice cream|sweet|dessert)\b/)) {
    suggestion = `\n\nHowever, here are the food places available on campus:\n` +
                `• Food Court (College Mess) - Located near the main entrance, serves breakfast, lunch, snacks, and dinner. Day scholars can pay ₹50 for a meal.\n` +
                `• Canteen - Gopi's Kitchen - Popular canteen offering South Indian breakfast items, snacks, rice dishes, juices, and beverages. Also called Day Scholar's Canteen.\n` +
                `• Bakery and Cake (Coca Cola Canteen) - Offers fresh baked goods, cakes, snacks, rolls, ice creams, milkshakes, and fresh fruit juices.`;
  }
  // Building/facility queries
  else if (lowerQuery.match(/\b(building|facility|place|location|where|bhavan|hostel|lab|library|gym|parking|auditorium|hall)\b/)) {
    suggestion = `\n\nHere are the main buildings and facilities on campus:\n` +
                `• Ramanujacharya Bhavan - Main classroom and administrative building\n` +
                `• Madhavacharya Bhavan - Library building with classrooms\n` +
                `• Shankaracharya Bhavan - Lab building with various departments\n` +
                `• Boys Hostel and Girls Hostel - Student accommodation\n` +
                `• Food Court, Canteen - Gopi's Kitchen, and Bakery - Food facilities\n` +
                `• Gym - Fitness facility\n` +
                `• Parking - Vehicle parking area\n` +
                `You can check the campus map for exact locations.`;
  }
  // Department queries
  else if (lowerQuery.match(/\b(department|dept|hod|office|staff|faculty|professor|teacher)\b/)) {
    suggestion = `\n\nThe main departments on campus include:\n` +
                `• Computer Science and Engineering (CSE)\n` +
                `• Information Science and Engineering (ISE)\n` +
                `• Mechanical Engineering\n` +
                `• Physics\n` +
                `• Mathematics\n` +
                `• Master of Computer Applications (MCA)\n` +
                `Department offices are located in Ramanujacharya Bhavan and Shankaracharya Bhavan. You can check the campus map or visit the College Office for more specific information.`;
  }
  // Service queries
  else if (lowerQuery.match(/\b(service|help|support|office|admin|account|fee|id card|lost|found|library|book|stationery|shop)\b/)) {
    suggestion = `\n\nFor administrative services, visit the College Office located in Ramanujacharya Bhavan (Ground Floor, South side). ` +
                `The office handles ID card reissue, lost and found, and other student services. ` +
                `For library services, visit Madhavacharya Bhavan. ` +
                `For stationery, there's a shop in Shankaracharya Bhavan (Ground Floor, South side near stairs).`;
  }
  // General fallback
  else {
    suggestion = `\n\nYou can find more information by:\n` +
                `• Checking the campus map for building locations\n` +
                `• Visiting the College Office in Ramanujacharya Bhavan for administrative queries\n` +
                `• Exploring the main buildings: Ramanujacharya Bhavan, Madhavacharya Bhavan, and Shankaracharya Bhavan`;
  }
  
  // Only add suggestion if response is truly a "not found" message
  if (isNotFound && suggestion) {
    return response + suggestion;
  }
  
  return response;
}

// Helper function to sleep/delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to call Gemini API with retry logic for 503 errors
async function callGemini(apiKey, prompt, retryCount = 0, maxRetries = 3) {
  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    // Check if response is OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // Retry logic for 503 (Service Unavailable / Overloaded) errors
      if (response.status === 503 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.warn(`⚠️ Gemini API overloaded (503). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
        await sleep(delay);
        return callGemini(apiKey, prompt, retryCount + 1, maxRetries);
      }
      
      // For other errors or max retries reached, throw error
      console.error(`❌ Gemini API error (${response.status}):`, errorData);
      throw new Error(`Gemini API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Log response structure for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('📥 Gemini API response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    }
    
    // Check for API errors in response
    if (data.error) {
      console.error('❌ Gemini API error in response:', data.error);
      throw new Error(`Gemini API error: ${JSON.stringify(data.error)}`);
    }
    
    // Try multiple response structure patterns
    let answer = null;
    
    // Pattern 1: data.candidates[0].content.parts[0].text
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      answer = data.candidates[0].content.parts[0].text;
    }
    // Pattern 2: data.candidates[0].content[0].parts[0].text
    else if (data?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text) {
      answer = data.candidates[0].content[0].parts[0].text;
    }
    // Pattern 3: data.candidates[0].text (alternative structure)
    else if (data?.candidates?.[0]?.text) {
      answer = data.candidates[0].text;
    }
    // Pattern 4: Check if candidates array exists but is empty
    else if (data?.candidates && data.candidates.length === 0) {
      console.warn('⚠️ Gemini API returned empty candidates array');
      throw new Error('Gemini API returned empty response');
    }
    // Pattern 5: Check for finishReason that might indicate blocking
    else if (data?.candidates?.[0]?.finishReason) {
      const finishReason = data.candidates[0].finishReason;
      if (finishReason === 'SAFETY') {
        console.warn('⚠️ Gemini API blocked response due to safety filters');
        throw new Error('Response was blocked by safety filters');
      } else if (finishReason === 'RECITATION') {
        console.warn('⚠️ Gemini API blocked response due to recitation');
        throw new Error('Response was blocked due to recitation');
      }
    }
    
    if (!answer) {
      console.error('❌ Could not extract answer from Gemini response:', JSON.stringify(data, null, 2));
      throw new Error('Unexpected response structure from Gemini API');
    }
    
    return answer.trim();
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error.message);
    throw error;
  }
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
    // 🧠 1. Classify intent - check for location/facility keywords first
    const lowerQ = q.toLowerCase();
    const locationKeywords = [
      'washroom', 'bathroom', 'toilet', 'restroom', 'wc', 'lavatory',
      'building', 'facility', 'department', 'hostel', 'library', 'canteen', 
      'mess', 'parking', 'bakery', 'food court', 'lab', 'laboratory', 'classroom',
      'office', 'hall', 'auditorium', 'gym', 'sports', 'where is', 'where are',
      'location', 'directions', 'how to reach', 'how to get to', 'find',
      'need to go', 'want to go', 'looking for', 'campus', 'college', 'bhavan'
    ];
    
    const isLocationQuery = locationKeywords.some(keyword => lowerQ.includes(keyword));
    
    // Also use Gemini for classification if not clearly a location query
    let intent = isLocationQuery ? "campus" : null;
    
    if (!intent) {
      try {
        const classifierPrompt = `
Classify the following question into one of these categories:
- "campus" if it asks about buildings, facilities, departments, hostels, library, canteen, mess, parking, bakery, food court, washroom, bathroom, toilet, restroom, or any college locations.
- "general" if it's about greetings, casual conversation, or non-location topics.

Question: "${q}"

Only respond with one word: campus or general.
`;

        const classification = await callGemini(apiKey, classifierPrompt, 0, 2); // Fewer retries for classification
        intent = classification?.toLowerCase().includes("campus") ? "campus" : "general";
      } catch (error) {
        console.warn('⚠️ Classification failed, defaulting to campus for location-related queries:', error.message);
        // If classification fails, default to campus for queries that might be location-related
        intent = isLocationQuery ? "campus" : "general";
      }
    }

    // 💬 2. Add the current question to conversation memory
    conversationHistory.push({ role: "user", text: q });
    if (conversationHistory.length > 6) conversationHistory.shift(); // keep last 6 exchanges

    // 🧠 3. Build contextual prompt
    let prompt;
    if (intent === "campus") {
      prompt = `
You are a helpful information assistant for the National Institute of Engineering, Mysore. Your job is to provide factual location and facility information from the knowledge base.

CRITICAL RULES:
1. You MUST use the campus information provided below to answer questions.
2. DO NOT give conversational responses like "I'll wait", "go ahead", "sure", etc.
3. DO NOT engage in casual conversation for location queries.
4. If the user asks about a location (e.g., "I need to go to washroom"), you MUST provide the actual location information from the knowledge base.
5. If the specific information is not in the knowledge base, provide helpful related information:
   - For food items/restaurants: Mention the available food places on campus (Food Court, Canteen - Gopi's Kitchen, Bakery and Cake)
   - For buildings/facilities: Mention similar buildings or related facilities available on campus
   - For departments: Mention the departments that are available or suggest checking the main building
   - For services: Mention where similar services might be available
6. Be direct and factual - provide building names, locations, and directions when available.
7. Always be helpful and provide contextually relevant alternatives when exact information isn't available.

Here is the official campus information:
---
${campusText}
---

Recent conversation history:
${conversationHistory.map(m => `${m.role}: ${m.text}`).join("\n")}

User question: "${q}"

Provide factual location information from the campus knowledge base. If the exact information isn't available, provide helpful related information about similar facilities or services on campus.
`;
    } else {
      prompt = `
You are a friendly, helpful AI assistant. Continue the conversation naturally.

Recent conversation history:
${conversationHistory.map(m => `${m.role}: ${m.text}`).join("\n")}

User: "${q}"
`;
    }

    // 🧩 4. Get Gemini's response
    let aiReply;
    try {
      aiReply = await callGemini(apiKey, prompt);
      
      if (!aiReply || aiReply.trim() === '') {
        console.error('❌ Gemini returned empty response');
        throw new Error('Empty response from Gemini API');
      }
      
      // Post-process: Enhance "not found" responses with contextual suggestions
      aiReply = enhanceNotFoundResponse(aiReply, q, campusText);
      
      // Add Gemini's reply to memory
      conversationHistory.push({ role: "assistant", text: aiReply });

      // 🧹 Trim to last 6 messages
      if (conversationHistory.length > 6) conversationHistory = conversationHistory.slice(-6);
    } catch (error) {
      console.error('❌ Failed to get response from Gemini:', error.message);
      
      // Check if it's a 503 error (overloaded) after all retries
      const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
      
      // If it's a campus query and we have campus text, provide a fallback
      if (intent === "campus" && campusText.trim().length > 0) {
        // Try to find basic information from campus text
        const lowerQ = q.toLowerCase();
        if (lowerQ.includes("shankaracharya") || lowerQ.includes("bhavan")) {
          aiReply = "Shankaracharya Bhavan is the Lab Building on campus. Please refer to the campus map for exact location details.";
        } else if (lowerQ.includes("building")) {
          aiReply = isOverloaded 
            ? "The AI service is currently busy. Please try again in a few moments or check the campus map for location details."
            : "I'm having trouble accessing the campus database right now. Please try again in a moment or check the campus map.";
        } else {
          aiReply = isOverloaded
            ? "The AI service is currently overloaded. Please try again in a few moments."
            : "I'm experiencing technical difficulties. Please try again in a moment.";
        }
      } else {
        aiReply = isOverloaded
          ? "The AI service is currently busy. Please try again in a few moments."
          : "I'm experiencing technical difficulties accessing the AI service. Please try again in a moment.";
      }
    }

    // Extract buildings mentioned in the response for structured data
    const mentionedBuildings = [];
    const buildingNames = [
      // Main Academic Buildings
      'Ramanujacharya Bhavan',
      'Ramanujacharya Bhavan (Classroom Building)',
      'Classroom Building',
      'Madhavacharya Bhavan', 
      'Madhavacharya Bhavan (Library Building)',
      'Library Building',
      'Shankaracharya Bhavan',
      'Shankaracharya Bhavan (Lab Building)',
      'Lab Building',
      'Main Building',
      'Central Library',
      'Library',
      
      // Hostels and Accommodation
      'Boys Hostel',
      'Girls Hostel',
      'Hostel',
      
      // Food and Dining
      'Food Court',
      'Food Court (College Mess)',
      'College Mess',
      'Canteen',
      'Canteen - Gopi\'s Kitchen',
      'Gopi\'s Kitchen',
      'Gopi\'s Kitchen (Canteen)',
      'Day Scholar\'s Canteen',
      'Day Scholar\'s Mess',
      'Day Scholar Sitting Area',
      'Bakery and Cake',
      'Bakery and Cake (Coca Cola Canteen)',
      'Coca Cola Canteen',
      'Coffee Shop',
      
      // Sports and Recreation
      'Gym',
      'Sports Complex',
      'Auditorium',
      'Seminar Hall',
      
      // Facilities and Services
      'Parking',
      'Combined Parking',
      'Bike Parking',
      'Bike Parking Shed',
      'Main Gate',
      'Training & Placement Cell',
      'T&P Cell',
      'TPO Office',
      'T&P Cells',
      'Infirmary',
      'First Aid',
      'Admission Cell',
      'Dean Office',
      'Board Room',
      'Stationery Shop',
      
      // Academic Departments and Labs
      'Department of Computer Science and Engineering',
      'CSE Department',
      'CSE Dept',
      'CSE HOD Office',
      'Department of Information Science and Engineering',
      'ISE Department',
      'ISE Dept',
      'ISE HOD Office',
      'Department of MCA',
      'MCA Department',
      'MCA Dept',
      'Department of Mechanical Engineering',
      'Mechanical Department',
      'Mechanical Dept',
      'Mechanical HOD Office',
      'Department of Physics',
      'Physics Department',
      'Physics Dept',
      'Physics HOD Office',
      'Department of Mathematics',
      'Mathematics Department',
      'Mathematics Dept',
      'Mathematics HOD Office',
      
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
      'Principal Room',
      'Vice Principal\'s Room',
      'Vice Principal',
      'College Office',
      'Office',
      'Boardroom',
      'Boardroom & Autonomous Cell',
      'Autonomous Cell',
      'Exam Control Room',
      'Exam Control',
      'Reading Rooms',
      'Staff Room',
      'CSE Staff Room 1',
      'CSE Staff Room 2',
      'ISE Staff Room 1',
      'ISE Staff Room 2',
      'ISE Staff Room',
      'Gents Staff Room',
      'Gents Staff Room (West)',
      'General Staff Room',
      'Mathematics Staff Room',
      'IT Cell',
      'ISE & IT Cell'
    ];
    
    buildingNames.forEach(building => {
      const regex = new RegExp(`\\b${building}\\b`, 'gi');
      if (aiReply && aiReply.match(regex)) {
        mentionedBuildings.push(building);
      }
    });

    res.json({ 
      reply: aiReply || "I'm having trouble generating a response. Please try again.",
      buildings: mentionedBuildings.length > 0 ? mentionedBuildings : undefined
    });
  } catch (error) {
    console.error("❌ Unexpected error in ask function:", error);
    res.status(500).json({
      reply: "An unexpected error occurred. Please try again later.",
    });
  }
}
