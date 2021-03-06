import { TimeConstructNodeDef } from '@masterthesis/shared';

import { TimeConstructNode } from '../../../../src/main/nodes/time/construct';

describe(TimeConstructNode.type, () => {
  test('should have correct properties', () => {
    expect(TimeConstructNode.type).toBe(TimeConstructNodeDef.type);
    expect(TimeConstructNode.isFormValid).toBeUndefined();
    expect(TimeConstructNode.isInputValid).toBeDefined();
  });

  test('should have invalid inputs', async () => {
    let res = await TimeConstructNode.isInputValid({
      hours: 25,
      minutes: 0,
      seconds: 0
    });
    expect(res).toBe(false);

    res = await TimeConstructNode.isInputValid({
      hours: 1,
      minutes: 60,
      seconds: 0
    });
    expect(res).toBe(false);

    res = await TimeConstructNode.isInputValid({
      hours: 1,
      minutes: 1,
      seconds: 60
    });
    expect(res).toBe(false);

    res = await TimeConstructNode.isInputValid({
      hours: -1,
      minutes: 1,
      seconds: 1
    });
    expect(res).toBe(false);

    res = await TimeConstructNode.isInputValid({
      hours: 1.5,
      minutes: 1,
      seconds: 1
    });
    expect(res).toBe(false);
  });

  test('should have valid inputs', async () => {
    let res = await TimeConstructNode.isInputValid({
      hours: 0,
      minutes: 0,
      seconds: 0
    });
    expect(res).toBe(true);

    res = await TimeConstructNode.isInputValid({
      hours: 12,
      minutes: 34,
      seconds: 56
    });
    expect(res).toBe(true);
  });

  test('should get output value from input', async () => {
    const time = new Date(Date.UTC(0, 0, 0, 11, 34, 56));
    const res = await TimeConstructNode.onNodeExecution(
      {},
      {
        hours: time.getUTCHours(),
        minutes: time.getUTCMinutes(),
        seconds: time.getUTCSeconds()
      },
      null
    );

    expect(res.outputs.value.getTime()).toBe(time.getTime());
  });

  test('should return empty object for onMetaExecution', async () => {
    let res = await TimeConstructNode.onMetaExecution(
      {},
      {
        hours: { content: {}, isPresent: false },
        minutes: { content: {}, isPresent: false },
        seconds: { content: {}, isPresent: false }
      },
      null
    );
    expect(res).toEqual({ value: { content: {}, isPresent: false } });

    res = await TimeConstructNode.onMetaExecution(
      {},
      {
        hours: { content: {}, isPresent: true },
        minutes: { content: {}, isPresent: false },
        seconds: { content: {}, isPresent: false }
      },
      null
    );
    expect(res).toEqual({ value: { content: {}, isPresent: false } });

    res = await TimeConstructNode.onMetaExecution(
      {},
      {
        hours: { content: {}, isPresent: true },
        minutes: { content: {}, isPresent: true },
        seconds: { content: {}, isPresent: false }
      },
      null
    );
    expect(res).toEqual({ value: { content: {}, isPresent: false } });
  });

  test('should valid empty object for onMetaExecution', async () => {
    const res = await TimeConstructNode.onMetaExecution(
      {},
      {
        hours: { content: {}, isPresent: true },
        minutes: { content: {}, isPresent: true },
        seconds: { content: {}, isPresent: true }
      },
      null
    );
    expect(res).toEqual({ value: { content: {}, isPresent: true } });
  });
});
