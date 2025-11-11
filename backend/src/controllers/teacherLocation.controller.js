import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Paths to Excel files
const timetablePath = join(__dirname, "../../assets/timetables.xlsx");
const facultyLocationsPath = join(__dirname, "../../assets/faculty_locations.xlsx");

// Time slot definitions (adjust these based on your actual schedule)
const TIME_SLOTS = [
  { slot: "09:00-10:00", startHour: 9, startMin: 0, endHour: 10, endMin: 0 },
  { slot: "10:00-11:00", startHour: 10, startMin: 0, endHour: 11, endMin: 0 },
  { slot: "11:15-12:15", startHour: 11, startMin: 15, endHour: 12, endMin: 15 },
  { slot: "12:15-13:15", startHour: 12, startMin: 15, endHour: 13, endMin: 15 },
  { slot: "14:00-15:00", startHour: 14, startMin: 0, endHour: 15, endMin: 0 },
  { slot: "15:00-16:00", startHour: 15, startMin: 0, endHour: 16, endMin: 0 },
  { slot: "16:00-17:00", startHour: 16, startMin: 0, endHour: 17, endMin: 0 },
];

// Get current day (Monday = 1, Sunday = 0)
function getCurrentDayColumn() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
  
  return teachers;
}

// Get teacher location from timetable based on current time
function getTeacherLocationFromTimetable(teacherName) {
  const timetableData = readExcelFile(timetablePath);
  if (!timetableData || timetableData.length < 2) {
    return null;
  }

  const currentDay = getCurrentDayColumn();
  const currentTimeSlot = getCurrentTimeSlot();
  
  if (!currentTimeSlot) {
    return { found: false, reason: "not_in_time_slot" };
  }

  // Find column index for current day and time slot
  const headers = timetableData[0];
  let dayTimeColumn = -1;
  
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase();
    if (header.includes(currentDay.toLowerCase()) && header.includes(currentTimeSlot)) {
      dayTimeColumn = i;
      break;
    }
  }

  if (dayTimeColumn === -1) {
    return { found: false, reason: "time_slot_not_found" };
  }

  // Find teacher row
  for (let i = 1; i < timetableData.length; i++) {
    if (String(timetableData[i][0]).toLowerCase() === teacherName.toLowerCase()) {
      const location = timetableData[i][dayTimeColumn];
      
      if (location && String(location).trim() !== "") {
        return { found: true, location: String(location).trim(), source: "timetable" };
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
        return { found: true, location: String(location).trim(), source: "usual_location" };
      }
    }
  }

  return { found: false, reason: "not_in_faculty_list" };
}

// Main controller function
export const findTeacher = async (req, res) => {
  try {
    const { teacher } = req.query;
    
    if (!teacher || !teacher.trim()) {
      return res.status(400).json({ 
        error: "Teacher name is required",
        message: "Please provide a teacher name to search for."
      });
    }

    const teacherName = teacher.trim();
    
    // First, try to get location from timetable
    const timetableResult = getTeacherLocationFromTimetable(teacherName);
    
    if (timetableResult && timetableResult.found) {
      return res.json({
        success: true,
        teacher: teacherName,
        location: timetableResult.location,
        source: "timetable",
        currentDay: getCurrentDayColumn(),
        currentTimeSlot: getCurrentTimeSlot(),
        message: `${teacherName} is currently at ${timetableResult.location}`
      });
    }

    // If not found in timetable or cell is empty, get usual location
    const usualLocationResult = getTeacherUsualLocation(teacherName);
    
    if (usualLocationResult && usualLocationResult.found) {
      return res.json({
        success: true,
        teacher: teacherName,
        location: usualLocationResult.location,
        source: "usual_location",
        reason: timetableResult ? timetableResult.reason : "fallback",
        message: `${teacherName} is usually at ${usualLocationResult.location}`
      });
    }

    // Teacher not found in either file
    return res.status(404).json({
      success: false,
      teacher: teacherName,
      message: `Teacher "${teacherName}" not found in our records.`
    });

  } catch (error) {
    console.error("Error in findTeacher:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while searching for the teacher."
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
      count: teachers.length
    });
  } catch (error) {
    console.error("Error in getAllTeachersList:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while fetching teachers list."
    });
  }
};

