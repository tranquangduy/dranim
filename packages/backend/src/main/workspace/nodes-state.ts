import {
  ApolloContext,
  ContextNodeType,
  hasContextFn,
  NodeInstance,
  NodeState
} from '@masterthesis/shared';

import { Log } from '../../logging';
import { isNodeInMetaValid } from '../calculation/validation';
import { getNodeType } from '../nodes/all-nodes';
import { getSafeObjectID } from '../utils';
import { deleteConnection, getAllConnections } from './connections';
import {
  getAllNodes,
  getNodesCollection,
  tryGetContextNode,
  tryGetNode
} from './nodes';
import {
  getContextInputDefs,
  getContextOutputDefs,
  tryGetParentNode
} from './nodes-detail';

export const updateStates = async (wsId: string, reqContext: ApolloContext) => {
  const allConns = await getAllConnections(wsId, reqContext);
  await Promise.all(
    allConns.map(async c => {
      const [inputNode, outputNode] = await Promise.all([
        reqContext.cache.tryGetOrFetch(c.from.nodeId, () =>
          tryGetNode(c.from.nodeId, reqContext)
        ),
        reqContext.cache.tryGetOrFetch(c.to.nodeId, () =>
          tryGetNode(c.to.nodeId, reqContext)
        )
      ]);
      if (inputNode.type === ContextNodeType.INPUT) {
        const contextInputDefs = await getContextInputDefs(
          inputNode,
          reqContext
        );
        if (contextInputDefs[c.from.name] === undefined) {
          await deleteConnection(c.id, reqContext);
        }
      } else if (outputNode.type === ContextNodeType.OUTPUT) {
        const contextOutputDefs = await getContextOutputDefs(
          outputNode,
          reqContext
        );
        if (contextOutputDefs[c.to.name] === undefined) {
          await deleteConnection(c.id, reqContext);
        }
      }
    })
  );

  const allNodes = await getAllNodes(wsId, reqContext);
  await Promise.all(allNodes.map(n => updateState(n, reqContext)));
};

export const updateState = async (
  node: NodeInstance,
  reqContext: ApolloContext
): Promise<NodeState> => {
  const state = await calculateState(node, reqContext);
  const nodesCollection = getNodesCollection(reqContext.db);
  await nodesCollection.updateOne(
    { _id: getSafeObjectID(node.id) },
    {
      $set: { state }
    }
  );
  return state;
};

const calculateState = async (
  node: NodeInstance,
  reqContext: ApolloContext
): Promise<NodeState> => {
  try {
    if (node.type === ContextNodeType.INPUT) {
      const parent = await tryGetParentNode(node, reqContext);
      return await calculateState(parent, reqContext);
    }

    const isValid = await isNodeInMetaValid(node, reqContext);
    if (!isValid) {
      return NodeState.INVALID;
    }

    const nodeType = getNodeType(node.type);
    if (nodeType != null && hasContextFn(nodeType)) {
      const contextOutputNode = await reqContext.cache.tryGetOrFetch(
        `con-op-${node.id}`,
        () => tryGetContextNode(node, ContextNodeType.OUTPUT, reqContext)
      );

      return await calculateState(contextOutputNode, reqContext);
    }

    return NodeState.VALID;
  } catch (err) {
    Log.error(`Calculation error: ${err.message}`);
    return NodeState.ERROR;
  }
};
