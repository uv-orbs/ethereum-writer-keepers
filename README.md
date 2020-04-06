# Ethereum Writer Service

Node service to send Ethereum transactions for elections lifecycle (like auto vote out).

## Install dev environment

* Make sure [Node.js](https://nodejs.org/) is installed (min 12.13.0).

  * Install with `brew install node`, check version with `node -v`.

* [VSCode](https://code.visualstudio.com/) is recommended as IDE.

  * Recommended extensions [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), [Prettier - code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

* [Docker](https://www.docker.com/) is required for running E2E tests.

  * Install [here](https://docs.docker.com/install/), check version with `docker -v`.

* Run in terminal in root project directory:

  ```
  npm install
  npm test
  ```

## Build

* Run in terminal in root project directory:

  ```
  npm run build
  ```

  > Note that the Python errors `gyp ERR! find Python` on `keccak node-gyp rebuild` are ok.

* Built code will be inside `./dist`.

  * Run it with `npm start`.

* Docker image will be built and tagged as `local/ethereum-writer`.

  * Run it with `docker run local/ethereum-writer`.

## Test

* For unit tests, run in terminal in root project directory:

  ```
  npm run test
  ```

* For E2E tests (on docker), run in terminal in root project directory:

  ```
  npm run build
  npm run test:e2e
  ```

  * Note: running E2E locally may leave docker residues:

    * See which instances are running with `docker ps`, stop all with `docker stop $(docker ps -a -q)`

    * See which images exist with `docker images`, delete all relevant with `docker rmi $(docker images --format '{{.Repository}}:{{.Tag}}' | grep 'cicontainer')`