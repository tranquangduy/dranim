import {
  ApolloContext,
  DatasetOutputNodeDef,
  DataType,
  IOValues,
  NodeInstance,
  NodeOutputResult,
  NodeState,
  NumberInputNodeDef,
  NumberOutputNodeDef,
  ProcessState,
  sleep,
  Workspace
} from '@masterthesis/shared';

import { executeNode } from '../../../src/main/calculation/execution';
import {
  CANCEL_CHECKS_MS,
  getAllCalculations,
  startProcess,
  stopCalculation,
  tryGetCalculation
} from '../../../src/main/calculation/start-process';
import { addOrUpdateResult } from '../../../src/main/dashboards/results';
import { clearGeneratedDatasets } from '../../../src/main/workspace/dataset';
import { getAllNodes } from '../../../src/main/workspace/nodes';
import { doTestWithDb, VALID_OBJECT_ID } from '../../test-utils';

jest.mock('../../../src/main/calculation/execution');
jest.mock('../../../src/main/dashboards/results');
jest.mock('../../../src/main/workspace/workspace');
jest.mock('../../../src/main/workspace/nodes');
jest.mock('../../../src/main/workspace/nodes-detail');
jest.mock('../../../src/main/workspace/dataset');

const ws: Workspace = {
  userId: '',
  name: 'test',
  description: '',
  created: '',
  id: VALID_OBJECT_ID,
  lastChange: ''
};

describe('Start Process', () => {
  test('should get empty calculations collection', () =>
    doTestWithDb(async db => {
      const processes = await getAllCalculations(ws.id, { db, userId: '' });

      expect(processes.length).toBe(0);
    }));

  test('should start new calculation process without any nodes', () =>
    doTestWithDb(async db => {
      (executeNode as jest.Mock).mockImplementation(() =>
        Promise.resolve<IOValues<{}>>({ outputs: {}, results: {} })
      );
      (getAllNodes as jest.Mock).mockResolvedValue([]);

      const newProcess = await startProcess(
        ws.id,
        { db, userId: '' },
        { awaitResult: true }
      );

      expect(newProcess.state).toBe(ProcessState.STARTED);
      expect(newProcess.finish).toBeNull();
      expect(newProcess.start).toBeDefined();

      const processes = await getAllCalculations(ws.id, { db, userId: '' });
      expect(processes.length).toBe(1);

      const finishedProcess = processes[0];
      expect(finishedProcess.state).toBe(ProcessState.SUCCESSFUL);
      expect(finishedProcess.finish).toBeDefined();
      expect(finishedProcess.start).toBeDefined();

      expect((executeNode as jest.Mock).mock.calls.length).toBe(0);
    }));

  test('should start new calculation process with one node', () =>
    doTestWithDb(async db => {
      const nodes: Array<NodeInstance> = [
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: NumberOutputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          progress: null,
          x: 0,
          y: 0
        },
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: DatasetOutputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          progress: null,
          x: 0,
          y: 0
        },
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: NumberInputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          progress: null,
          x: 0,
          y: 0
        }
      ];
      (executeNode as jest.Mock).mockImplementation(n =>
        Promise.resolve<IOValues<{}>>({ outputs: {}, results: {} })
      );
      (getAllNodes as jest.Mock).mockResolvedValue(nodes);

      const newProcess = await startProcess(
        ws.id,
        { db, userId: '' },
        { awaitResult: true }
      );

      expect(newProcess.state).toBe(ProcessState.STARTED);
      expect(newProcess.finish).toBeNull();
      expect(newProcess.start).toBeDefined();

      const processes = await getAllCalculations(ws.id, { db, userId: '' });
      expect(processes.length).toBe(1);

      const finishedProcess = processes[0];
      expect(finishedProcess.state).toBe(ProcessState.SUCCESSFUL);
      expect(finishedProcess.finish).toBeDefined();
      expect(finishedProcess.start).toBeDefined();

      expect((executeNode as jest.Mock).mock.calls.length).toBe(2);
    }));

  test('should start new calculation process with one node with results', () =>
    doTestWithDb(async db => {
      const resultA: NodeOutputResult<number> = {
        type: DataType.NUMBER,
        name: 'n',
        value: 9,
        description: 'desc'
      };
      const resultB: NodeOutputResult<string> = {
        type: DataType.STRING,
        name: 'n',
        value: 'test',
        description: 'desc'
      };
      const nodes: Array<NodeInstance> = [
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: NumberOutputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          progress: null,
          x: 0,
          y: 0
        },
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: DatasetOutputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          progress: null,
          x: 0,
          y: 0
        },
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: NumberInputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          progress: null,
          x: 0,
          y: 0
        }
      ];
      (executeNode as jest.Mock)
        .mockResolvedValueOnce({ outputs: {}, results: resultA })
        .mockResolvedValueOnce({ outputs: {}, results: resultB });
      (getAllNodes as jest.Mock).mockResolvedValue(nodes);

      const newProcess = await startProcess(
        ws.id,
        { db, userId: '' },
        { awaitResult: true }
      );

      expect(newProcess.state).toBe(ProcessState.STARTED);
      expect(newProcess.finish).toBeNull();
      expect(newProcess.start).toBeDefined();

      const processes = await getAllCalculations(ws.id, { db, userId: '' });
      expect(processes.length).toBe(1);

      const finishedProcess = processes[0];
      expect(finishedProcess.state).toBe(ProcessState.SUCCESSFUL);
      expect(finishedProcess.finish).toBeDefined();
      expect(finishedProcess.start).toBeDefined();

      expect(executeNode as jest.Mock).toHaveBeenCalledTimes(2);
      expect(clearGeneratedDatasets).toHaveBeenCalledTimes(1);
      expect(addOrUpdateResult as jest.Mock).toHaveBeenCalledTimes(2);
      expect(addOrUpdateResult as jest.Mock).toHaveBeenCalledWith(
        resultA,
        VALID_OBJECT_ID,
        {
          db,
          userId: ''
        }
      );
      expect(addOrUpdateResult as jest.Mock).toHaveBeenCalledWith(
        resultB,
        VALID_OBJECT_ID,
        {
          db,
          userId: ''
        }
      );
    }));

  test('should stop calculation', () =>
    doTestWithDb(async db => {
      const calculation = await startProcess(
        ws.id,
        { db, userId: '' },
        { awaitResult: true }
      );

      const res = await stopCalculation(calculation.id, { db, userId: '' });
      expect(res).toBe(true);
    }));

  test('should get calculation', () =>
    doTestWithDb(async db => {
      const calculation = await startProcess(
        ws.id,
        { db, userId: '' },
        { awaitResult: true }
      );

      const res = await tryGetCalculation(calculation.id, { db, userId: '' });
      expect({
        ...res,
        ...{ finish: null, state: ProcessState.STARTED }
      }).toEqual(calculation);
    }));

  test('should not get calculation', () =>
    doTestWithDb(async db => {
      const reqContext: ApolloContext = { userId: '', db };

      try {
        const res = await tryGetCalculation('abc', reqContext);
        expect(res).toBe(null);
      } catch (e) {
        expect(e.message).toBe('Unknown calculation');
      }

      try {
        const res = await tryGetCalculation(VALID_OBJECT_ID, reqContext);
        expect(res).toBe(null);
      } catch (e) {
        expect(e.message).toBe('Unknown calculation');
      }
    }));

  test('should catch error for failed node execution', () =>
    doTestWithDb(async db => {
      (executeNode as jest.Mock).mockImplementation(n => {
        throw new Error('Something went wrong during node execution.');
      });
      (getAllNodes as jest.Mock).mockResolvedValue([
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: NumberOutputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          x: 0,
          y: 0
        }
      ]);

      const newProcess = await startProcess(
        ws.id,
        { db, userId: '' },
        { awaitResult: true }
      );

      expect(newProcess.state).toBe(ProcessState.STARTED);
      expect(newProcess.finish).toBeNull();
      expect(newProcess.start).toBeDefined();

      const processes = await getAllCalculations(ws.id, { db, userId: '' });
      expect(processes.length).toBe(1);

      const finishedProcess = processes[0];
      expect(finishedProcess.state).toBe(ProcessState.ERROR);
      expect(finishedProcess.finish).toBeDefined();
      expect(finishedProcess.start).toBeDefined();

      expect(executeNode).toHaveBeenCalledTimes(1);
      expect(clearGeneratedDatasets).toHaveBeenCalledTimes(1);
    }));

  /* test('should check for canceled process and clear datasets', () =>
    doTestWithDb(async db => {
      const nodes: Array<NodeInstance> = [
        {
          contextIds: [],
          form: {},
          id: VALID_OBJECT_ID,
          inputs: [],
          outputs: [],
          state: NodeState.VALID,
          type: NumberOutputNodeDef.type,
          variables: {},
          workspaceId: VALID_OBJECT_ID,
          progress: null,
          x: 0,
          y: 0
        }
      ];
      (executeNode as jest.Mock).mockImplementation(async () => {
        await sleep(CANCEL_CHECKS_MS * 1.2);
        throw new Error('Should have been stopped');
      });
      (getAllNodes as jest.Mock).mockResolvedValue(nodes);

      let res = await startProcess(ws.id, { db, userId: '' });

      await sleep(100);
      const stopRes = await stopCalculation(res.id, { db, userId: '' });
      await sleep(CANCEL_CHECKS_MS);

      res = await tryGetCalculation(res.id, { db, userId: '' });
      const { finish, id, start, ...otherRes } = res;

      expect(stopRes).toBe(true);
      expect(clearGeneratedDatasets).toHaveBeenCalledTimes(1);
      expect(otherRes).toEqual({
        state: ProcessState.CANCELED,
        userId: '',
        workspaceId: VALID_OBJECT_ID
      });
    }));*/

  test('should stop cancel check for successful job', () =>
    doTestWithDb(async db => {
      (getAllNodes as jest.Mock).mockResolvedValue([]);

      let res = await startProcess(ws.id, { db, userId: '' });

      await sleep(500);

      res = await tryGetCalculation(res.id, { db, userId: '' });
      const { finish, id, start, ...otherRes } = res;

      expect(clearGeneratedDatasets).toHaveBeenCalled();
      expect(otherRes).toEqual({
        state: ProcessState.SUCCESSFUL,
        userId: '',
        workspaceId: VALID_OBJECT_ID
      });
    }));
});
