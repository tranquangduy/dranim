# Visual Data Explorer


## Requirements

- Node 10
- Docker
- Yarn

## Commands

### Before

- run `yarn` once to fetch all dependencies

### Build

#### Development

- run `yarn build` to build frontend and backend
  - run `cd packages/frontend && yarn build` to build only frontend
  - run `cd packages/backend && yarn build` to build only backend

#### Production

1.  run `./scripts/build` to build projects
2.  run `./scripts/assemble` to build one Docker image composed of images for frontend, backend and MonogDB

### Start

#### Development

1.  run `yarn mongodb` to start mongodb instance from Docker image (this might require admin rights to start the docker service)
2.  run `yarn start` to start full development application, or:
    - run `cd packages/frontend && yarn start` to start only frontend
    - run `cd packages/backend && yarn start` to start only backend

#### Production

- run `./scripts/start` to start Docker image

### Test

- run `yarn test` to test full development application, or:
  - run `cd packages/shared && yarn test` to test only shared code
  - run `cd packages/backend && yarn test` to test only backend

### Lint

- run `yarn lint` to lint all code

### Clean

- run `yarn clean` to remove `node_modules` folders, cache folder from Parcel and built distributions
