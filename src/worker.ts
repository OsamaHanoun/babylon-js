import { CSVAggregateReader } from "./lib/csv-aggregate-reader";
import { WorldManager } from "./lib/world-manager";

const csvUrl = new URL("/AB8_CMG_full.csv", import.meta.url).href;

let worldManager: WorldManager;

onmessage = async function (evt: MessageEvent<Message>) {
  const { messageName } = evt.data;

  switch (messageName) {
    case "init":
      const csvResponse = await fetch(csvUrl);
      const csvString = await csvResponse.text();
      const baseAggregateArray = await CSVAggregateReader.parse(csvString);

      worldManager = new WorldManager(
        evt.data.canvas,
        false,
        25,
        25,
        25,
        baseAggregateArray
      );
      worldManager.run();
      break;

    case "resize":
      const { width, height } = evt.data;
      worldManager.resize(width, height);
      break;

    case "pauseSimulation":
      worldManager.pauseSimulation();
      break;

    case "stopAddingAggregates":
      worldManager.stopAddingAggregates();
      break;

    case "presumeAddingAggregates":
      worldManager.presumeAddingAggregates();
      break;

    default:
      break;
  }
};
