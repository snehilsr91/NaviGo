import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Paths to Excel files
const timetablePath = join(__dirname, "../../assets/timetables.xlsx");
const facultyLocationsPath = join(
  __dirname,
  "../../assets/faculty_locations.xlsx"
);

// Time slot definitions (adjust these based on your actual schedule)
const TIME_SLOTS = [
  { slot: "09:00-10:00", startHour: 9, startMin: 0, endHour: 10, endMin: 0 },
  { slot: "10:00-11:00", startHour: 10, startMin: 0, endHour: 11, endMin: 0 },
  { slot: "11:30-12:30", startHour: 11, startMin: 30, endHour: 12, endMin: 30 },
  { slot: "12:30-13:30", startHour: 12, startMin: 30, endHour: 13, endMin: 30 },
  { slot: "14:00-15:00", startHour: 14, startMin: 0, endHour: 15, endMin: 0 },
  { slot: "15:00-16:00", startHour: 15, startMin: 0, endHour: 16, endMin: 0 },
  { slot: "16:00-17:00", startHour: 16, startMin: 0, endHour: 17, endMin: 0 },
];

// Get current day (Monday = 1, Sunday = 0)
function getCurrentDayColumn() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const today = new Date().getDay();
  return days[today];
}

// Get abbreviated day name (first 3 letters)
function getAbbreviatedDay() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();
  return days[today];
}

// Find current time slot
function getCurrentTimeSlot() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeInMin = currentHour * 60 + currentMin;

  for (const slot of TIME_SLOTS) {
    const startTimeInMin = slot.startHour * 60 + slot.startMin;
    const endTimeInMin = slot.endHour * 60 + slot.endMin;

    if (currentTimeInMin >= startTimeInMin && currentTimeInMin < endTimeInMin) {
      return slot.slot;
    }
  }

  return null; // Not in any time slot
}

// Read Excel file and convert to JSON
function readExcelFile(filePath) {
  try {
    const fileBuffer = readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Debug logging to verify fresh data is being read
    console.log(`📖 Reading Excel file: ${filePath}`);
    console.log(`📊 Rows loaded: ${data.length}`);
    if (data.length > 0) {
      console.log(`📋 Headers: ${data[0].slice(0, 5).join(", ")}...`);
    }

    return data;
  } catch (error) {
    console.error(`Error reading Excel file at ${filePath}:`, error);
    return null;
  }
}

// Get all teachers from timetable
function getAllTeachers() {
  const timetableData = readExcelFile(timetablePath);
  if (!timetableData || timetableData.length < 2) {
    return [];
  }

  // First column contains teacher names (skip header)
  const teachers = [];
  for (let i = 1; i < timetableData.length; i++) {
    if (timetableData[i][0]) {
      teachers.push(timetableData[i][0]);
    }
  }

  console.log(`👥 Teachers loaded: ${teachers.join(", ")}`);
  return teachers;
}

// Get teacher location from timetable based on current time
function getTeacherLocationFromTimetable(teacherName) {
  const timetableData = readExcelFile(timetablePath);
  if (!timetableData || timetableData.length < 2) {
    return null;
  }

  const currentDay = getCurrentDayColumn();
  const currentDayAbbr = getAbbreviatedDay();
  const currentTimeSlot = getCurrentTimeSlot();

  if (!currentTimeSlot) {
    return { found: false, reason: "not_in_time_slot" };
  }

  // Find column index for current day and time slot
  const headers = timetableData[0];
  let dayTimeColumn = -1;

  console.log(`🔍 Looking for: ${currentDayAbbr} ${currentTimeSlot}`);
  console.log(`📋 Available headers:`, headers);

  // Normalize time slot for flexible matching (handles both "9:00" and "09:00")
  const normalizeTime = (timeStr) => {
    return timeStr.replace(/\b0(\d)/g, "$1"); // Remove leading zeros
  };
  const normalizedTimeSlot = normalizeTime(currentTimeSlot);

  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase().trim();
    const normalizedHeader = normalizeTime(header);
    const dayAbbr = currentDayAbbr.toLowerCase();

    // Check if header contains the abbreviated day name and time slot
    // Handle formats like "Wed 11:30-12:30" or "Thu 9:00-10:00"
    if (
      normalizedHeader.includes(dayAbbr) &&
      (normalizedHeader.includes(normalizedTimeSlot.toLowerCase()) ||
        header.includes(currentTimeSlot.toLowerCase()))
    ) {
      dayTimeColumn = i;
      console.log(`✅ Found matching column at index ${i}: ${headers[i]}`);
      break;
    }
  }

  if (dayTimeColumn === -1) {
    console.log(
      `❌ No matching column found for ${currentDayAbbr} ${currentTimeSlot}`
    );
    console.log(`📝 Tried normalized: ${normalizedTimeSlot}`);
    return { found: false, reason: "time_slot_not_found" };
  }

  // Find teacher row
  for (let i = 1; i < timetableData.length; i++) {
    if (
      String(timetableData[i][0]).toLowerCase() === teacherName.toLowerCase()
    ) {
      const location = timetableData[i][dayTimeColumn];

      if (location && String(location).trim() !== "") {
        return {
          found: true,
          location: String(location).trim(),
          source: "timetable",
        };
      } else {
        return { found: false, reason: "empty_cell" };
      }
    }
  }

  return { found: false, reason: "teacher_not_found" };
}

// Get teacher's usual location from faculty locations
function getTeacherUsualLocation(teacherName) {
  const facultyData = readExcelFile(facultyLocationsPath);
  if (!facultyData || facultyData.length < 2) {
    return null;
  }

  // Assuming structure: [Teacher Name, Location]
  for (let i = 1; i < facultyData.length; i++) {
    if (String(facultyData[i][0]).toLowerCase() === teacherName.toLowerCase()) {
      const location = facultyData[i][1];
      if (location && String(location).trim() !== "") {
        return {
          found: true,
          location: String(location).trim(),
          source: "usual_location",
        };
      }
    }
  }

  return { found: false, reason: "not_in_faculty_list" };
}

// Check if current time is outside campus hours
function isOutsideCampusHours() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeInMin = currentHour * 60 + currentMin;

  // Before 9:00 AM
  const campusStartTime = 9 * 60; // 9:00 AM in minutes
  // After 4:30 PM (16:30)
  const campusEndTime = 16 * 60 + 30; // 4:30 PM in minutes

  return (
    currentTimeInMin < campusStartTime || currentTimeInMin >= campusEndTime
  );
}

// Format location - if it's just a number or contains "MB", add "Room" prefix
function formatLocation(location) {
  if (!location) return location;

  const trimmedLocation = String(location).trim();

  // Check if location is just a number (e.g., "302", "101")
  // OR if it contains "MB" (e.g., "MB1", "MB2", "MB-3")
  if (/^\d+$/.test(trimmedLocation) || /MB/i.test(trimmedLocation)) {
    return `Room ${trimmedLocation}`;
  }

  return trimmedLocation;
}

// Main controller function
export const findTeacher = async (req, res) => {
  try {
    const { teacher } = req.query;

    if (!teacher || !teacher.trim()) {
      return res.status(400).json({
        error: "Teacher name is required",
        message: "Please provide a teacher name to search for.",
      });
    }

    const teacherName = teacher.trim();

    // Check if it's outside campus hours
    if (isOutsideCampusHours()) {
      return res.json({
        success: true,
        teacher: teacherName,
        location: null,
        source: "off_hours",
        message: "Teacher not on campus right now",
      });
    }

    // Try to get location from timetable
    const timetableResult = getTeacherLocationFromTimetable(teacherName);

    // If found in timetable with a location
    if (timetableResult && timetableResult.found) {
      const formattedLocation = formatLocation(timetableResult.location);
      return res.json({
        success: true,
        teacher: teacherName,
        location: formattedLocation,
        source: "timetable",
        currentDay: getCurrentDayColumn(),
        currentTimeSlot: getCurrentTimeSlot(),
        message: `${teacherName} is currently at ${formattedLocation}`,
      });
    }

    // Get usual location
    const usualLocationResult = getTeacherUsualLocation(teacherName);

    // If timetable cell is empty (teacher is free) and we have usual location
    if (
      timetableResult &&
      timetableResult.reason === "empty_cell" &&
      usualLocationResult &&
      usualLocationResult.found
    ) {
      const formattedLocation = formatLocation(usualLocationResult.location);
      return res.json({
        success: true,
        teacher: teacherName,
        location: formattedLocation,
        source: "usual_location",
        status: "free",
        currentDay: getCurrentDayColumn(),
        currentTimeSlot: getCurrentTimeSlot(),
        message: `${teacherName} is free right now. Usually at ${formattedLocation}`,
      });
    }

    // If not in any time slot but we have usual location
    if (
      timetableResult &&
      timetableResult.reason === "not_in_time_slot" &&
      usualLocationResult &&
      usualLocationResult.found
    ) {
      const formattedLocation = formatLocation(usualLocationResult.location);
      return res.json({
        success: true,
        teacher: teacherName,
        location: formattedLocation,
        source: "usual_location",
        status: "free",
        message: `${teacherName} is free right now. Usually at ${formattedLocation}`,
      });
    }

    // Fallback to usual location
    if (usualLocationResult && usualLocationResult.found) {
      const formattedLocation = formatLocation(usualLocationResult.location);
      return res.json({
        success: true,
        teacher: teacherName,
        location: formattedLocation,
        source: "usual_location",
        reason: timetableResult ? timetableResult.reason : "fallback",
        message: `${teacherName} is usually at ${formattedLocation}`,
      });
    }

    // Teacher not found in either file
    return res.status(404).json({
      success: false,
      teacher: teacherName,
      message: `Teacher "${teacherName}" not found in our records.`,
    });
  } catch (error) {
    console.error("Error in findTeacher:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while searching for the teacher.",
    });
  }
};

// Get all available teachers
export const getAllTeachersList = async (req, res) => {
  try {
    const teachers = getAllTeachers();

    return res.json({
      success: true,
      teachers: teachers,
      count: teachers.length,
    });
  } catch (error) {
    console.error("Error in getAllTeachersList:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while fetching teachers list.",
    });
  }
};

// Debug endpoint to check timetable structure
export const debugTimetable = async (req, res) => {
  try {
    const timetableData = readExcelFile(timetablePath);
    const currentDay = getCurrentDayColumn();
    const currentDayAbbr = getAbbreviatedDay();
    const currentTimeSlot = getCurrentTimeSlot();
    const now = new Date();

    return res.json({
      success: true,
      debug: {
        currentDay: currentDay,
        currentDayAbbreviated: currentDayAbbr,
        currentTimeSlot: currentTimeSlot,
        currentTime: now.toLocaleTimeString(),
        lookingFor: `${currentDayAbbr} ${currentTimeSlot}`,
        isOutsideCampusHours: isOutsideCampusHours(),
        headers: timetableData ? timetableData[0] : [],
        teacherNames: timetableData
          ? timetableData.slice(1).map((row) => row[0])
          : [],
        rowCount: timetableData ? timetableData.length : 0,
        timeSlots: TIME_SLOTS,
      },
    });
  } catch (error) {
    console.error("Error in debugTimetable:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
