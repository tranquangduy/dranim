import { Dataset, DatasetOutputNodeDef, DataType } from '@masterthesis/shared';

import { DatasetOutputNode } from '../../../../src/main/nodes/dataset/output';
import { createDataset } from '../../../../src/main/workspace/dataset';
import { createManyEntries } from '../../../../src/main/workspace/entry';
import { NODE, VALID_OBJECT_ID } from '../../../test-utils';

jest.mock('../../../../src/main/workspace/dataset');
jest.mock('../../../../src/main/workspace/entry');
jest.mock('../../../../src/main/workspace/entry');

describe('DatasetOutputNode', () => {
  test('should have correct properties', () => {
    expect(DatasetOutputNode.type).toBe(DatasetOutputNodeDef.type);
    expect(DatasetOutputNode.isInputValid).toBeUndefined();
    expect(DatasetOutputNode.isFormValid).toBeDefined();
    expect(DatasetOutputNodeDef.isOutputNode).toBe(true);
  });

  test('should have valid dataset', async () => {
    const ds: Dataset = {
      id: VALID_OBJECT_ID,
      userId: '',
      name: 'tes',
      description: '',
      created: new Date().toISOString(),
      workspaceId: VALID_OBJECT_ID,
      valueschemas: []
    };
    (createDataset as jest.Mock).mockResolvedValue(ds);

    const res = await DatasetOutputNode.onNodeExecution(
      { name: 'DS Name', description: '' },
      {
        dataset: {
          entries: [{ test: 'yes' }],
          schema: [
            {
              name: 'test',
              type: DataType.STRING,
              fallback: '',
              required: true,
              unique: false
            }
          ]
        }
      },
      {
        reqContext: { db: null, userId: '' },
        node: NODE
      }
    );

    expect(res.outputs).toBeDefined();
    expect(res.results.value.id).toBe(VALID_OBJECT_ID);
    expect(res.results.value.name).toBe('DS Name');
    expect(createManyEntries).toHaveBeenCalledWith(
      VALID_OBJECT_ID,
      [{ test: 'yes' }],
      expect.anything()
    );
  });

  test('should return empty meta for dataset', async () => {
    const res = await DatasetOutputNode.onMetaExecution(
      { description: '', name: '' },
      {
        dataset: {
          isPresent: true,
          content: {
            schema: [
              {
                name: 'test',
                fallback: '',
                required: false,
                unique: true,
                type: DataType.STRING
              }
            ]
          }
        }
      },
      {
        db: null,
        userId: ''
      }
    );
    expect(res).toEqual({});
  });
});
