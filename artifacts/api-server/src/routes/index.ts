import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanGearRouter from "./scanGear";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanGearRouter);

export default router;
