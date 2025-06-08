# Testing PrimeOS

PrimeOS uses Jest for unit tests and includes additional test runners. Jest and its TypeScript typings are included in the dev dependencies of the root `package.json`. Before running the test suite, install dependencies:

```bash
npm install
```

This command installs both production and development dependencies required to execute the tests.

To run the default test suite:

```bash
npm test
```

To execute the full set of PrimeOS tests, including module and integration tests, run:

```bash
npm run test:all
```

Refer to `GETTING-STARTED.md` for more information on the development workflow.
