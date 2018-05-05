const FormValue = `
  type FormValue {
    name: String!
    value: String!
  }
`;

const Node = `
  type Node {
    id: String!
    type: String!
    x: Float!
    y: Float!
    form: [FormValue!]!
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
  }
`;

const ConnectionInput = `
  input ConnectionInput {
    from: SocketInput
    to: SocketInput
  }
`;

const Editor = `
  type Editor {
    nodes: [Node!]!
    connections: [Connection!]!
  }
`;

export default () => [
  FormValue,
  Node,
  NodeInput,
  Socket,
  SocketInput,
  Connection,
  ConnectionInput,
  Editor
];