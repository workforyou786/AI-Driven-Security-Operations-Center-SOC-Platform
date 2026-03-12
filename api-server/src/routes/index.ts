import { Router, type IRouter } from "express";
import healthRouter from "./health";
import threatsRouter from "./threats";
import incidentsRouter from "./incidents";
import logsRouter from "./logs";
import analyticsRouter from "./analytics";
import responseRouter from "./response";

const router: IRouter = Router();

router.use(healthRouter);
router.use(threatsRouter);
router.use(incidentsRouter);
router.use(logsRouter);
router.use(analyticsRouter);
router.use(responseRouter);

export default router;
