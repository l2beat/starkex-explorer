# @explorer/backend

## Setup

To run or develop the backend you need to install and build its dependencies. You can do it by running the following commands in the repository root:

```
yarn
yarn build
```

## Scripts

- `yarn build` - build the application
- `yarn start` - start the built application
- `yarn dev` - start the application using _eslint-register_
- `yarn format` - check if formatting is correct with prettier
- `yarn format:fix` - run prettier automatic formatter
- `yarn lint` - check if the code satisfies the eslint configuration
- `yarn lint:fix` - run eslint automatic fixer
- `yarn typecheck` - check if the code satisfies the typescript compiler
- `yarn test` - run tests

## Setup

To run or develop the backend you need to install and build its dependencies. You can do it by running the following commands in the repository root:

```
yarn
```

After the nodejs dependencies have been installed you should also install a Postgres database. The recommended way is through docker using the commands below.

```
docker run -d --name=state_explorer_postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
docker exec -it state_explorer_postgres psql -U postgres -c 'CREATE DATABASE local'
docker exec -it state_explorer_postgres psql -U postgres -c 'CREATE DATABASE test'
```

If you restart your system running `docker start state_explorer_postgres` will bring the database back online.

Once you have everything create a `.env` file with the following contents:

```
LOCAL_DB_URL=postgresql://postgres:password@localhost:5432/local
TEST_DB_URL=postgresql://postgres:password@localhost:5432/test
```

## Environment variables

You can configure the behavior of the app with the following environment variables:

- `DATABASE_URL` - Database url used in production deployment
- `LOCAL_DB_URL` - Database url used in `yarn start`
- `TEST_DB_URL` - Database url used in `yarn test`
- `LOG_LEVEL` - Integer specifying the log level (`0 | 1 | 2 | 3`). See `src/tools/Logger.ts`
- `PORT` - The port on which the application exposes the api
- `MAX_BLOCK_NUMBER` - Integer specifying the maximum block number that is going to be stored - all blocks created later in time will be skipped (used in environments with limited database space e.g. heroku review apps)

## Repository naming convention

- `add(T): number` - adds a new record and returns it's id
- `addMany(T[]): number[]` - adds many new records and returns their ids
- `getAll(): T[]` - returns an array of all records
- `getByKey(K): T[]` - returns an array of all matching records
- `findByKey(K): T?` - returns a single matching record or undefined
- `deleteAll(): number` - removes all records and returns the number of removed records
- `deleteByKey(K): number` - removes all matching records and returns the number of removed records
