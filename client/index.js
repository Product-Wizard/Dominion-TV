// IMPORTANT: Service must be imported BEFORE registerRootComponent so that
// TaskManager.defineTask is called at module evaluation time.
import "./services/LiveSchedulerService";

import { registerRootComponent } from "expo";
import App from "@/App";

registerRootComponent(App);
