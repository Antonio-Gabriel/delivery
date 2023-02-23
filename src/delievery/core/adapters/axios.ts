import { Devilery } from '@/delievery/data/delievery';
import BaseAdapter from './base.type';
import { AxiosResponse } from 'axios';
import { tryCatchWith } from '@/delievery/utils/trycatch';
import { propEq, runIfExists } from '@/delievery/utils/operators';
import { mapStatusDelivery } from '../contracts/http';

export type AxiosResult = Promise<AxiosResponse<any, any>>;

export class AxiosAdapter implements BaseAdapter {
  constructor(private axiosResult: AxiosResult) {}

  execute(): Devilery {
    const deliveryObject = new Devilery();

    (async () => {
      try {
        const response = await this.axiosResult;

        const { status: statusCode } = response;
        const isOk = statusCode > 199 && statusCode < 300;

        if (isOk) {
          runIfExists(deliveryObject.onSuccess, response);
          runIfExists(deliveryObject.onJson, !isOk, response.data);
        }
      } catch (error) {
        const { response } = error as unknown as {
          response: { status: number; statusText: string };
        };

        const deliveryStatus = mapStatusDelivery.find(
          propEq('status', response.status)
        );
        if (deliveryStatus) {
          const key = deliveryStatus.key as keyof typeof deliveryObject;
          runIfExists(deliveryObject[key], new Error(deliveryStatus.message));
        }
      }
    })();

    return deliveryObject;
  }
}
