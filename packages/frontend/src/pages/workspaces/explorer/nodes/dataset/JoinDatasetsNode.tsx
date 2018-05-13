import * as React from 'react';
import { Form, Select } from 'antd';
import { DATASET_TYPE, OutputSocketInformation } from '../Sockets';
import { getOrDefault, getValidInput } from '../utils';
import { ClientNodeDef } from '../AllNodes';

export const JoinDatasetsNode: ClientNodeDef = {
  title: 'Join Datasets',
  onClientExecution: (inputs, context) => {
    const validInputA = getValidInput('Dataset A', inputs);
    const validInputB = getValidInput('Dataset B', inputs);
    if (!validInputA || !validInputB) {
      return new Map<string, OutputSocketInformation>([
        ['Combined', { dataType: DATASET_TYPE, isPresent: false }]
      ]);
    }

    const inputValuesA = validInputA.meta
      ? validInputA.meta.filter(m => m.name === 'schema').map(s => s.info)
      : [];
    const inputValuesB = validInputB.meta
      ? validInputB.meta.filter(m => m.name === 'schema').map(s => s.info)
      : [];

    const idValue = getOrDefault<string | null>(
      context.node.form,
      'value',
      null
    );

    if (!idValue) {
      return new Map<string, OutputSocketInformation>([
        ['Combined', { dataType: DATASET_TYPE, isPresent: false }]
      ]);
    }

    const isIdPresentInInputs =
      inputValuesA.includes(idValue) && inputValuesB.includes(idValue);
    if (!isIdPresentInInputs) {
      return new Map<string, OutputSocketInformation>([
        ['Combined', { dataType: DATASET_TYPE, isPresent: false }]
      ]);
    }

    const allSchemas = new Set(inputValuesA.concat(inputValuesB));
    return new Map<string, OutputSocketInformation>([
      [
        'Dataset',
        {
          dataType: DATASET_TYPE,
          meta: [
            {
              name: 'schemas',
              info: Array.from(allSchemas)
            }
          ]
        }
      ]
    ]);
  },
  renderFormItems: ({
    form,
    form: { getFieldDecorator },
    state: { datasets }
  }) => {
    return (
      <Form.Item label="Input">
        {getFieldDecorator('value', {
          rules: [{ required: true }]
        })(
          <Select
            showSearch
            style={{ width: 200 }}
            placeholder="Select ID Value"
          >
            {datasets.map(ds => (
              <Select.Option value={ds.id} key={ds.id}>
                {ds.name}
              </Select.Option>
            ))}
          </Select>
        )}
      </Form.Item>
    );
  }
};
