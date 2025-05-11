import express from "express";
const router = express.Router();
import isLoggedIn from "../middleware/isLoggedIn";
import { isSuperAdmin } from "../middleware/isSuperAdmin";
import { isAdmin } from "../middleware/isAdmin";
import getLandMarksByWard from "../controllers/landmarks/getLandMark";
import { School } from "../entities/landmarks/School";
import { AppDataSource } from "../config/database";
import { Hospital } from "../entities/landmarks/Hospital";
import { Temple } from "../entities/landmarks/Temple";
import { BrickFactory } from "../entities/landmarks/BrickFactory";
import { Chowk } from "../entities/landmarks/Chowk";
import { Stadium } from "../entities/landmarks/Stadium";
import { Farm } from "../entities/landmarks/Farm";
import { Bazar } from "../entities/landmarks/Bazar";
import { Tole } from "../entities/landmarks/Tole";
import { WardOffice } from "../entities/landmarks/wardOffice";

router.get("/school", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(School), req, res, next);
});

router.get("/hospital", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(Hospital), req, res, next);
});

router.get("/temple", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(Temple), req, res, next);
});

router.get("/brick-factory", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(BrickFactory), req, res, next);
});

router.get("/chowk", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(Chowk), req, res, next);
});

router.get("/stadium", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(Stadium), req, res, next);
});

router.get("/farm", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(Farm), req, res, next);
});

router.get("/bazar", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(Bazar), req, res, next);
});

router.get("/tole", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(Tole), req, res, next);
});

router.get("/ward-office", isLoggedIn, (req, res, next) => {
  getLandMarksByWard(AppDataSource.getRepository(WardOffice), req, res, next);
});

module.exports = router;
