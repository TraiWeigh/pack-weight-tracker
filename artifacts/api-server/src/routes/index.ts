import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanGearRouter from "./scanGear";
import linksRouter from "./links";
import importGearRouter from "./importGear";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanGearRouter);
router.use(importGearRouter);
router.use(linksRouter);

export default router;
