import * as React from 'react';

import {
  AddValuesNodeDef,
  AddValuesNodeForm,
  Colors,
  DataType,
  ForEachEntryNodeInputs,
  ForEachEntryNodeOutputs,
  ValueSchema
} from '@masterthesis/shared';
import { Button, Checkbox, Col, Input, Row, Select, Tag } from 'antd';

import { showNotificationWithIcon } from '../../../utils/form';
import { ClientNodeDef } from '../all-nodes';

const UNIQUE = 'unique';
const REQUIRED = 'required';

export const AddValuesNode: ClientNodeDef<
  ForEachEntryNodeInputs,
  ForEachEntryNodeOutputs,
  AddValuesNodeForm
> = {
  type: AddValuesNodeDef.type,
  renderFormItems: ({
    form,
    form: { getFieldDecorator, setFieldsValue, getFieldValue },
    nodeForm,
    inputs,
    touchForm,
    setTempState,
    getTempState
  }) => {
    getFieldDecorator('values', {
      initialValue: nodeForm.values || []
    });
    const values = getFieldValue('values');
    return (
      <>
        <Row style={{ marginBottom: 8 }} gutter={8}>
          <Col xs={24} lg={6} xxl={6}>
            <Input
              defaultValue={defaultName}
              placeholder="Name"
              onChange={ev => setTempState({ newValueName: ev.target.value })}
            />
          </Col>
          <Col xs={24} lg={6} xxl={4}>
            <Select
              defaultValue={defaultType}
              onSelect={val => setTempState({ newValueType: val })}
            >
              <Select.OptGroup label="Primitive">
                {[
                  DataType.STRING,
                  DataType.NUMBER,
                  DataType.BOOLEAN,
                  DataType.DATETIME,
                  DataType.TIME
                ].map(type => (
                  <Select.Option value={type} key={`option-${type}`}>
                    {type}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
          </Col>
          <Col xs={24} lg={6} xxl={4}>
            <Checkbox.Group
              options={[UNIQUE, REQUIRED]}
              defaultValue={defaultTags}
              onChange={checkboxValues =>
                setTempState({ newValueTags: checkboxValues })
              }
            />
          </Col>
          <Col xs={24} lg={6} xxl={3}>
            <Button
              icon="plus"
              style={{ width: '100%' }}
              onClick={() =>
                addValue(
                  getFieldValue,
                  setFieldsValue,
                  touchForm,
                  values,
                  getTempState
                )
              }
            >
              Add Value
            </Button>
          </Col>
        </Row>
        {values.map(v => renderValue(v, setFieldsValue, touchForm, values))}
      </>
    );
  }
};

const renderValue = (
  v: ValueSchema,
  setFieldsValue: (obj: object) => void,
  touchForm: () => void,
  values: Array<ValueSchema>
) => (
  <Row key={v.name} justify="space-around" gutter={8}>
    <Col xs={9} lg={6} xxl={6}>
      <p>{v.name}</p>
    </Col>
    <Col xs={9} lg={12} xxl={8}>
      <Tag color={Colors[v.type]}>{v.type}</Tag>
      {v.required && <Tag>Required</Tag>}
      {v.unique && <Tag>Unique</Tag>}
    </Col>
    <Col xs={6} lg={6} xxl={3}>
      <Button
        type="dashed"
        shape="circle"
        icon="cross"
        onClick={() => removeValue(v, setFieldsValue, touchForm, values)}
      />
    </Col>
  </Row>
);

const defaultName = '';
const defaultType = DataType.STRING;
const defaultTags = [REQUIRED];

const removeValue = (
  v: ValueSchema,
  setFieldsValue: (obj: object) => void,
  touchForm: () => void,
  values: Array<ValueSchema>
) => {
  setFieldsValue({
    values: values.filter(n => n.name !== v.name)
  });
  touchForm();
};

const addValue = (
  getFieldValue: (name: string) => any,
  setFieldsValue: (obj: object) => void,
  touchForm: () => void,
  values: Array<ValueSchema>,
  getTempState: () => any
) => {
  const tempState = getTempState();
  const name =
    tempState.newValueName === undefined ? defaultName : tempState.newValueName;
  const type =
    tempState.newValueType === undefined ? defaultType : tempState.newValueType;
  const required =
    tempState.newValueTags === undefined
      ? defaultTags.includes(REQUIRED)
      : tempState.newValueTags.includes(REQUIRED);
  const unique =
    tempState.newValueTags === undefined
      ? defaultTags.includes(UNIQUE)
      : tempState.newValueTags.includes(UNIQUE);
  if (!name || !type || values.find(v => v.name === name) !== undefined) {
    showNotificationWithIcon({
      icon: 'error',
      content: 'Name must be unique and not empty',
      title: 'Value not added'
    });
    return;
  }

  const newVal: ValueSchema = {
    name,
    type,
    fallback: '',
    required,
    unique
  };

  setFieldsValue({
    values: [...values, newVal]
  });
  touchForm();
};
