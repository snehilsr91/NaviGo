import express from "express";
import { findTeacher, getAllTeachersList, debugTimetable } from "../controllers/teacherLocation.controller.js";

const router = express.Router();

// GET /api/teachers/find?teacher=TeacherName
router.get("/find", findTeacher);

// GET /api/teachers/list
router.get("/list", getAllTeachersList);

// GET /api/teachers/debug - Debug endpoint to check timetable structure
router.get("/debug", debugTimetable);

export default router;

