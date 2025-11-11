import express from "express";
import { findTeacher, getAllTeachersList } from "../controllers/teacherLocation.controller.js";

const router = express.Router();

// GET /api/teachers/find?teacher=TeacherName
router.get("/find", findTeacher);

// GET /api/teachers/list
router.get("/list", getAllTeachersList);

export default router;

