import {
  ConnectionInstance,
  ContextNodeType,
  NodeDef,
  NodeInstance,
  NodeState,
  ServerNodeDef,
  InMemoryCache
} from '@masterthesis/shared';

import { isNodeInMetaValid } from '../../../src/main/calculation/validation';
import { getNodeType, tryGetNodeType } from '../../../src/main/nodes/all-nodes';
import {
  deleteConnection,
  getAllConnections
} from '../../../src/main/workspace/connections';
import {
  getAllNodes,
  getNodesCollection,
  tryGetContextNode,
  tryGetNode
} from '../../../src/main/workspace/nodes';
import {
  getContextInputDefs,
  getContextOutputDefs,
  tryGetParentNode
} from '../../../src/main/workspace/nodes-detail';
import {
  updateState,
  updateStates
} from '../../../src/main/workspace/nodes-state';
import { VALID_OBJECT_ID } from '../../test-utils';

jest.mock('../../../src/main/workspace/nodes');
jest.mock('../../../src/main/workspace/nodes-detail');
jest.mock('../../../src/main/nodes/all-nodes');
jest.mock('../../../src/main/calculation/validation');
jest.mock('../../../src/main/workspace/connections');

describe('Node State', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should update state for simple node', async () => {
    const node: NodeInstance = {
      id: VALID_OBJECT_ID,
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [],
      type: 'type',
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const type: ServerNodeDef & NodeDef = {
      type: 'type',
      name: 't',
      inputs: {},
      outputs: {},
      keywords: [],
      path: [],
      isFormValid: async () => false,
      onMetaExecution: async () => ({}),
      onNodeExecution: async () => ({ outputs: {} })
    };
    (isNodeInMetaValid as jest.Mock).mockReturnValue(true);
    (getNodeType as jest.Mock).mockReturnValueOnce(type);

    (tryGetNodeType as jest.Mock).mockReturnValueOnce(type);
    (tryGetNode as jest.Mock).mockReturnValueOnce(node);
    (getNodesCollection as jest.Mock).mockReturnValue({
      updateOne: jest.fn()
    });

    const res = await updateState(node, {
      db: null,
      userId: '',
      cache: new InMemoryCache()
    });
    expect(res).toBe(NodeState.VALID);
    expect(getNodesCollection(null).updateOne).toHaveBeenCalledTimes(1);
  });

  test('should update state for context input node based on parent', async () => {
    const node: NodeInstance = {
      id: VALID_OBJECT_ID,
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [],
      type: ContextNodeType.INPUT,
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const contextNode: NodeInstance = {
      id: VALID_OBJECT_ID,
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [],
      type: ContextNodeType.OUTPUT,
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const parentNode: NodeInstance = {
      id: VALID_OBJECT_ID,
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [],
      type: 'type',
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const parentType: ServerNodeDef & NodeDef = {
      type: 'type',
      name: 't',
      inputs: {},
      outputs: {},
      keywords: [],
      path: [],
      isFormValid: async () => false,
      onMetaExecution: async () => ({}),
      onNodeExecution: async () => ({ outputs: {} })
    };

    (getNodesCollection as jest.Mock).mockReturnValue({
      updateOne: jest.fn()
    });
    (isNodeInMetaValid as jest.Mock).mockReturnValue(true);
    (getNodeType as jest.Mock)
      .mockReturnValueOnce(parentType)
      .mockReturnValueOnce(null);
    (tryGetContextNode as jest.Mock).mockResolvedValue(contextNode);
    (tryGetParentNode as jest.Mock).mockResolvedValueOnce(parentNode);

    const res = await updateState(node, {
      db: null,
      userId: '',
      cache: new InMemoryCache()
    });
    expect(res).toBe(NodeState.VALID);
    expect(getNodesCollection(null).updateOne).toHaveBeenCalledTimes(1);
  });

  test('should update state for node with context', async () => {
    const node: NodeInstance = {
      id: VALID_OBJECT_ID,
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [],
      type: 'type',
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const type: ServerNodeDef & NodeDef = {
      type: 'type',
      name: 't',
      inputs: {},
      outputs: {},
      keywords: [],
      path: [],
      isFormValid: async () => false,
      onMetaExecution: async () => ({}),
      onNodeExecution: async () => ({ outputs: {} })
    };
    const cNode: NodeInstance = {
      id: VALID_OBJECT_ID,
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [],
      type: 'type',
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const cType: ServerNodeDef & NodeDef = {
      type: ContextNodeType.OUTPUT,
      name: 't',
      inputs: {},
      outputs: {},
      keywords: [],
      path: [],
      isFormValid: async () => false,
      onMetaExecution: async () => ({}),
      onNodeExecution: async () => ({ outputs: {} })
    };
    (isNodeInMetaValid as jest.Mock).mockReturnValue(true);
    (getNodeType as jest.Mock)
      .mockReturnValueOnce(type)
      .mockReturnValueOnce(cType);
    (tryGetContextNode as jest.Mock).mockResolvedValue(cNode);

    (tryGetNodeType as jest.Mock).mockReturnValueOnce(type);
    (tryGetNode as jest.Mock).mockReturnValueOnce(node);
    (getNodesCollection as jest.Mock).mockReturnValue({
      updateOne: jest.fn()
    });

    const res = await updateState(node, {
      db: null,
      userId: '',
      cache: new InMemoryCache()
    });
    expect(res).toBe(NodeState.VALID);
    expect(getNodesCollection(null).updateOne).toHaveBeenCalledTimes(1);
  });

  test('should remove invalid connections', async () => {
    const conns: Array<ConnectionInstance> = [
      {
        workspaceId: VALID_OBJECT_ID,
        contextIds: [],
        from: { nodeId: 'other', name: 'a' },
        to: { nodeId: 'o', name: 'a' },
        id: VALID_OBJECT_ID
      },
      {
        workspaceId: VALID_OBJECT_ID,
        contextIds: [],
        from: { nodeId: 'i', name: 'a' },
        to: { nodeId: VALID_OBJECT_ID, name: 'a' },
        id: VALID_OBJECT_ID
      }
    ];
    const nodeA: NodeInstance = {
      id: 'i',
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
      type: ContextNodeType.INPUT,
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const otherNode: NodeInstance = {
      id: 'other',
      contextIds: [],
      form: {},
      inputs: [],
      outputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
      type: 'type',
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const nodeB: NodeInstance = {
      id: 'o',
      contextIds: [],
      form: {},
      inputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
      outputs: [],
      type: ContextNodeType.OUTPUT,
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const type: ServerNodeDef & NodeDef = {
      type: 'type',
      name: 't',
      inputs: {},
      outputs: {},
      keywords: [],
      path: [],
      isFormValid: async () => true,
      onMetaExecution: async () => ({}),
      onNodeExecution: async () => ({ outputs: {} })
    };
    (getAllConnections as jest.Mock).mockResolvedValueOnce(conns);
    (tryGetNode as jest.Mock).mockImplementation(
      async nodeId =>
        nodeId === 'i' ? nodeA : nodeId === 'o' ? nodeB : otherNode
    );
    (getContextInputDefs as jest.Mock).mockResolvedValue({});
    (getContextOutputDefs as jest.Mock).mockResolvedValue({});
    (getAllNodes as jest.Mock).mockResolvedValueOnce([]);
    (tryGetNodeType as jest.Mock).mockReturnValue(type);
    (getNodeType as jest.Mock).mockReturnValue(type);

    await updateStates(VALID_OBJECT_ID, {
      db: null,
      userId: '',
      cache: new InMemoryCache()
    });

    expect(deleteConnection).toHaveBeenCalledTimes(2);
  });

  test('should keep valid connections', async () => {
    const conns: Array<ConnectionInstance> = [
      {
        workspaceId: VALID_OBJECT_ID,
        contextIds: [],
        from: { nodeId: VALID_OBJECT_ID, name: 'a' },
        to: { nodeId: 'o', name: 'a' },
        id: VALID_OBJECT_ID
      },
      {
        workspaceId: VALID_OBJECT_ID,
        contextIds: [],
        from: { nodeId: 'i', name: 'a' },
        to: { nodeId: VALID_OBJECT_ID, name: 'a' },
        id: VALID_OBJECT_ID
      },
      {
        workspaceId: VALID_OBJECT_ID,
        contextIds: [],
        from: { nodeId: VALID_OBJECT_ID, name: 'a' },
        to: { nodeId: VALID_OBJECT_ID, name: 'a' },
        id: VALID_OBJECT_ID
      }
    ];
    const nodeA: NodeInstance = {
      id: 'i',
      contextIds: [VALID_OBJECT_ID],
      form: {},
      inputs: [],
      outputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
      type: ContextNodeType.INPUT,
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const otherNode: NodeInstance = {
      id: 'other',
      contextIds: [VALID_OBJECT_ID],
      form: {},
      inputs: [],
      outputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
      type: 'type',
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    const nodeB: NodeInstance = {
      id: 'o',
      contextIds: [VALID_OBJECT_ID],
      form: {},
      inputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
      outputs: [],
      type: ContextNodeType.OUTPUT,
      workspaceId: VALID_OBJECT_ID,
      x: 0,
      y: 0,
      state: NodeState.VALID,
      progress: null,
      variables: {}
    };
    (getAllConnections as jest.Mock).mockResolvedValueOnce(conns);
    (tryGetNode as jest.Mock).mockImplementation(
      async nodeId =>
        nodeId === 'i' ? nodeA : nodeId === 'o' ? nodeB : otherNode
    );
    (getContextInputDefs as jest.Mock).mockResolvedValue({ a: 0 });
    (getContextOutputDefs as jest.Mock).mockResolvedValue({ a: 0 });
    (getAllNodes as jest.Mock).mockResolvedValueOnce([]);

    await updateStates(VALID_OBJECT_ID, {
      db: null,
      userId: '',
      cache: new InMemoryCache()
    });

    expect(deleteConnection).not.toHaveBeenCalled();
  });

  test('should update state of all nodes in workspace', async () => {
    const nodes: Array<NodeInstance> = [
      {
        id: VALID_OBJECT_ID,
        contextIds: [VALID_OBJECT_ID],
        form: {},
        inputs: [],
        outputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
        type: ContextNodeType.INPUT,
        workspaceId: VALID_OBJECT_ID,
        x: 0,
        y: 0,
        state: NodeState.VALID,
        progress: null,
        variables: {}
      },
      {
        id: VALID_OBJECT_ID,
        contextIds: [VALID_OBJECT_ID],
        form: {},
        inputs: [],
        outputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
        type: 'type',
        workspaceId: VALID_OBJECT_ID,
        x: 0,
        y: 0,
        state: NodeState.VALID,
        progress: null,
        variables: {}
      },
      {
        id: VALID_OBJECT_ID,
        contextIds: [VALID_OBJECT_ID],
        form: {},
        inputs: [{ name: 'a', connectionId: VALID_OBJECT_ID }],
        outputs: [],
        type: ContextNodeType.OUTPUT,
        workspaceId: VALID_OBJECT_ID,
        x: 0,
        y: 0,
        state: NodeState.VALID,
        progress: null,
        variables: {}
      }
    ];
    (getAllConnections as jest.Mock).mockResolvedValueOnce([]);
    (getAllNodes as jest.Mock).mockResolvedValueOnce(nodes);
    (getNodesCollection as jest.Mock).mockReturnValue({
      updateOne: jest.fn()
    });

    await updateStates(VALID_OBJECT_ID, {
      db: null,
      userId: '',
      cache: new InMemoryCache()
    });

    expect(getNodesCollection(null).updateOne).toHaveBeenCalledTimes(3);
  });
});
