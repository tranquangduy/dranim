const FormValue = `
  type FormValue {
    name: String!
    value: String!
  }
`;

const SocketValue = `
  type SocketValue {
    name: String!
    connectionId: String!
  }
`;

const Node = `
  type Node {
    id: String!
    type: String!
    x: Float!
    y: Float!
    inputs: [SocketValue!]!
    outputs: [SocketValue!]!
    state: String!
    form: [FormValue!]!
    workspace: Workspace!
  }
`;

const NodeInput = `
  input NodeInput {
    id: String!
    type: String!
    x: Float!
    y: Float!
  }
`;

const Socket = `
  type Socket {
    nodeId: String!
    name: String!
  }
`;

const SocketInput = `
  input SocketInput {
    nodeId: String!
    name: String!
  }
`;

const Connection = `
  type Connection {
    id: String!
    from: Socket
    to: Socket
    workspace: Workspace!
  }
`;

const ConnectionInput = `
  input ConnectionInput {
    from: SocketInput
    to: SocketInput
  }
`;

const Workspace = `
  type Workspace {
    id: String!
    name: String!
    lastChange: String!
    created: String!
    description: String!
    nodes: [Node!]!
    connections: [Connection!]!
  }
`;

export default () => [
  FormValue,
  SocketValue,
  Node,
  NodeInput,
  Socket,
  SocketInput,
  Connection,
  ConnectionInput,
  Workspace
];