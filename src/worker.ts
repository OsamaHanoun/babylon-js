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
      const aggregatesParams = (await CSVAggregateReader.parse(csvString)).data;

      worldManager = new WorldManager(
        evt.data.canvas,
        false,
        100,
        100,
        100,
        aggregatesParams
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
