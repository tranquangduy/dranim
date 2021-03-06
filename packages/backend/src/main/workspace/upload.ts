import {
  ApolloContext,
  Dataset,
  DataType,
  ProcessState,
  UploadProcess,
  Values,
  ValueSchema
} from '@masterthesis/shared';
import fastCsv from 'fast-csv';
import { Db, ObjectID } from 'mongodb';
import { Batcher } from 'promise-batcher';
import promisesAll from 'promises-all';
import { Readable } from 'stream';

import { Log } from '../../logging';
import { Omit } from '../../main';
import { tryGetDataset } from '../../main/workspace/dataset';
import { createManyEntriesWithDataset } from '../../main/workspace/entry';
import { getSafeObjectID } from '../utils';

const MAX_BATCH_SIZE = 10000;
const MAX_BATCH_DELAY = 2000;

interface ApolloFile {
  stream: Readable;
  filename: string;
}

export class UploadEntryError extends Error {
  private errorType: string;

  constructor(customMessage: string, errorType: string) {
    super(customMessage);
    this.errorType = errorType;
  }

  public getType() {
    return this.errorType;
  }
}

export const getUploadsCollection = <T = UploadProcess & { _id: ObjectID }>(
  db: Db
) => db.collection<T>('Uploads');

export const getAllUploads = async (
  datasetId: string,
  reqContext: ApolloContext
): Promise<Array<UploadProcess>> => {
  const collection = getUploadsCollection(reqContext.db);
  const all = await collection
    .find({ datasetId })
    .sort({ start: -1 })
    .toArray();
  return all.map(({ _id, ...ds }) => ({
    id: _id.toHexString(),
    finish: ds.finish ? ds.finish : null,
    ...ds
  }));
};

export const getUpload = async (
  id: string,
  reqContext: ApolloContext
): Promise<UploadProcess | null> => {
  const collection = getUploadsCollection(reqContext.db);
  const res = await collection.findOne({ _id: getSafeObjectID(id) });
  if (!res) {
    return null;
  }

  const { _id, ...upload } = res;

  return {
    id: res._id.toHexString(),
    ...upload
  };
};

const cleanData = (transformedInput: {
  obj: any;
  schema: Array<ValueSchema>;
}) => {
  if (!transformedInput || !transformedInput.obj) {
    return null;
  }

  const processedObj = {};
  transformedInput.schema.forEach(s => {
    const val = transformedInput.obj[s.name];
    let parsedVal = val;

    if (s.type === DataType.BOOLEAN) {
      try {
        parsedVal = Boolean(JSON.parse(val));
      } catch (err) {
        //
      }
    } else if (s.type === DataType.NUMBER) {
      try {
        parsedVal = Number(JSON.parse(val));
      } catch (err) {
        //
      }
    }

    processedObj[s.name] = parsedVal;
  });

  return {
    obj: processedObj,
    schema: transformedInput.schema
  };
};

const isValidEntry = (transformedInput: {
  obj: any;
  schema: Array<ValueSchema>;
}) => {
  if (!transformedInput) {
    return false;
  }

  const parsedObj = transformedInput.obj;
  const schema = transformedInput.schema;
  if (!parsedObj) {
    return false;
  }

  if (Object.keys(parsedObj).length !== schema.length) {
    return false;
  }

  return schema
    .map(s => {
      const correspondingVal = parsedObj[s.name];
      if (correspondingVal === undefined) {
        return false;
      }

      if (s.type === DataType.NUMBER && isNaN(correspondingVal)) {
        return false;
      } else if (
        s.type === DataType.BOOLEAN &&
        (correspondingVal !== true && correspondingVal !== false)
      ) {
        return false;
      } else if (s.type === DataType.DATETIME) {
        // TODO validate date
      }

      return true;
    })
    .reduce((a, b) => a && b, true);
};

const parseCsvFile = async (
  stream: Readable,
  filename: string,
  ds: Dataset,
  processId: string,
  reqContext: ApolloContext
): Promise<boolean> => {
  Log.info(`Started import of ${filename}.`);

  const dbRequestBatcher = initBatcher(ds, processId, reqContext);

  try {
    let invalidEntries = 0;
    await new Promise((resolve, reject) => {
      const csvStream = fastCsv({
        ignoreEmpty: true,
        objectMode: true,
        strictColumnHandling: true,
        trim: true,
        headers: ds.valueschemas.map(s => s.name)
      })
        .transform(obj => cleanData({ obj, schema: ds.valueschemas }))
        .validate(isValidEntry)
        .on('data', values => dbRequestBatcher.getResult(values.obj))
        .on('data-invalid', a => {
          if (a) {
            invalidEntries++;
          }
        });

      stream
        .pipe(csvStream)
        .on('error', reject)
        .on('finish', async () => {
          const collection = getUploadsCollection(reqContext.db);
          await dbRequestBatcher.send();
          await collection.updateOne(
            { _id: getSafeObjectID(processId) },
            {
              $set: { invalidEntries }
            },
            { upsert: true }
          );
          resolve();
        });
    });
    Log.info(`Finished import of ${filename}.`);
  } catch (err) {
    Log.error(err);
  }

  return true;
};

const initBatcher = (
  ds: Dataset,
  processId: string,
  reqContext: ApolloContext
) =>
  new Batcher<Values, boolean>({
    batchingFunction: async values => {
      Log.info('Doing batch request with ' + values.length + ' items');

      const res = await createManyEntriesWithDataset(ds, values, reqContext);
      const errorNames = {};
      const incArg: { failedEntries: number; addedEntries: number } = {
        failedEntries: 0,
        addedEntries: res.addedEntries
      };
      let failedEntries = 0;
      Object.entries(res.errors).forEach(e => {
        errorNames[`errors.${e[0]}.message`] = e[0];
        incArg[`errors.${e[0]}.count`] = e[1];
        failedEntries += e[1];
      });
      incArg.failedEntries = failedEntries;

      const collection = getUploadsCollection(reqContext.db);
      await collection.updateOne(
        { _id: getSafeObjectID(processId) },
        {
          $inc: incArg,
          ...(Object.keys(errorNames).length > 0 ? { $set: errorNames } : {})
        },
        { upsert: true }
      );
      return new Array(values.length);
    },
    maxBatchSize: MAX_BATCH_SIZE,
    queuingDelay: MAX_BATCH_DELAY
  });

const processUpload = async (
  file: ApolloFile,
  ds: Dataset,
  processId: string,
  reqContext: ApolloContext
): Promise<void> => {
  const uploadsCollection = getUploadsCollection(reqContext.db);

  try {
    const { stream, filename } = await file;
    await parseCsvFile(stream, filename, ds, processId, reqContext);
    await uploadsCollection.updateOne(
      { _id: getSafeObjectID(processId) },
      { $push: { fileNames: filename } }
    );
  } catch (err) {
    Log.error(err);
    throw new Error('Upload has failed.');
  }
};

const startUpload = async (
  ds: Dataset,
  processId: string,
  files: Array<ApolloFile>,
  reqContext: ApolloContext
) => {
  const uploadsCollection = getUploadsCollection(reqContext.db);
  const { reject } = await promisesAll.all(
    files.map(f => processUpload(f, ds, processId, reqContext))
  );

  if (reject.length) {
    reject.forEach(({ name, message }) => {
      Log.error(`Upload failed for ${name}: ${message}`);
    });
    await uploadsCollection.updateOne(
      { _id: getSafeObjectID(processId) },
      { $set: { state: ProcessState.ERROR, finish: new Date() } }
    );
  } else {
    await uploadsCollection.updateOne(
      { _id: getSafeObjectID(processId) },
      { $set: { state: ProcessState.SUCCESSFUL, finish: new Date() } }
    );
  }
};

export const uploadEntriesCsv = async (
  files: Array<ApolloFile>,
  datasetId: string,
  reqContext: ApolloContext
): Promise<UploadProcess> => {
  try {
    const uploadsCollection = getUploadsCollection<
      Omit<UploadProcess, 'id' | 'start' | 'errors'> & {
        start: Date;
        errors: object;
      }
    >(reqContext.db);
    const ds = await tryGetDataset(datasetId, reqContext);
    const newProcess = {
      addedEntries: 0,
      failedEntries: 0,
      invalidEntries: 0,
      start: new Date(),
      state: ProcessState.STARTED,
      finish: null,
      datasetId,
      fileNames: [],
      errors: {}
    };
    const res = await uploadsCollection.insertOne(newProcess);
    if (res.result.ok !== 1 || res.insertedCount !== 1) {
      throw new Error('Creating Upload process failed.');
    }

    const { _id, ...rest } = res.ops[0];

    const process: UploadProcess = {
      id: _id.toHexString(),
      ...rest
    };
    await startUpload(ds, process.id, files, reqContext);

    return process;
  } catch (err) {
    console.error(err);
    Log.error(err);
    throw new Error('Upload failed');
  }
};
