import { ParseResult, parse } from "papaparse";
import { BaseAggregate } from "./parts/base-aggregate";

export class CSVAggregateReader {
  static async parse(csvString: string): Promise<BaseAggregate[]> {
    const aggregateArray: BaseAggregate[] = [];

    parse(csvString, {
      skipEmptyLines: true,
      dynamicTyping: true,
      header: true,
      complete: function ({ data }) {
        const isNumber = (value: any): boolean => {
          return typeof value === "number";
        };

        data.forEach((params: any, index) => {
          const { a, b, c, vf_max, n_cuts } = params;
          const id = index.toString();

          if (
            isNumber(a) &&
            isNumber(b) &&
            isNumber(c) &&
            isNumber(vf_max) &&
            isNumber(n_cuts)
          ) {
            aggregateArray.push(new BaseAggregate(id, a, b, c, vf_max, n_cuts));
          }
        });
      },
    });

    return aggregateArray;
  }
}
