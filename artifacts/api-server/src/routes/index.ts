import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanGearRouter from "./scanGear";
import linksRouter from "./links";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanGearRouter);
router.use(linksRouter);

export default router;
