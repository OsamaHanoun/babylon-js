import { ParseResult, parse } from "papaparse";
import { Aggregate } from "./types";

export class CSVAggregateReader {
  static async parse(csvString: string): Promise<ParseResult<Aggregate>> {
    return parse(csvString, {
      skipEmptyLines: true,
      dynamicTyping: true,
      header: true,
      complete: function ({ data }) {
        data.forEach((params: any) => {
          params.maxVolumeFriction = params["vf_max"];
          delete params["vf_max"];

          params.numCuts = params["n_cuts"];
          delete params["n_cuts"];
        });

        return data;
      },
    });
  }
}
