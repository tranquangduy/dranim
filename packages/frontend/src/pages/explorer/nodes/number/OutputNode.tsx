import { NumberSocket } from '../Sockets';
import { NodeDef } from '../AllNodes';

export const NumberOutputNode: NodeDef = {
  title: 'Number Output',
  inputs: [NumberSocket('Number', 'input')],
  outputs: [],
  path: ['Number'],
  keywords: [],
  onClientExecution: () => new Map()
};