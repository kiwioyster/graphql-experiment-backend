process.once('SIGUSR2', () =>
  server.close((err) => process.kill(process.pid, 'SIGUSR2'))
);

import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLList,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
} from 'graphql';
import cors from 'cors';

const app = express();
const fs = require('fs');
const PORT = process.env.PORT || '4008';
const readFileAsync = require('util').promisify(fs.readFile);
const readJson = readFileAsync('./data/rainfall-data.json', {
  encoding: 'utf8',
});

const objectMap = (obj, fn) => Object.keys(obj).map((key) => fn(key, obj[key]));
const RainfallDataType = new GraphQLObjectType({
  name: 'RainfallData',
  fields: () => ({
    date: {
      type: GraphQLString,
    },
    rainfall: {
      type: GraphQLFloat,
    },
  }),
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      yearlyRainfall: {
        type: new GraphQLList(RainfallDataType),
        resolve: (_) =>
          readJson.then((data) => {
            const rainfall = objectMap(JSON.parse(data), (key, value) => {
              return { date: key, rainfall: value.rainfall };
            });
            console.log(rainfall);
            return rainfall;
          }),
      },
      monthlyRainfall: {
        type: new GraphQLList(RainfallDataType),
        resolve: (_) =>
          readJson.then((data) => {
            const rainfall = objectMap(JSON.parse(data), (year, months) => {
              return objectMap(months, (month, value) => {
                if (month !== 'rainfall') {
                  return { date: `${year}-${month}`, rainfall: value.rainfall };
                }
              });
            });
            console.log(rainfall.flat().filter((obj) => obj));
            return rainfall.flat().filter((obj) => obj);
          }),
      },
      dailyRainfall: {
        type: new GraphQLList(RainfallDataType),
        resolve: (_) =>
          readJson.then((data) => {
            const rainfall = objectMap(JSON.parse(data), (year, months) => {
              return objectMap(months, (month, days) => {
                if (month !== 'rainfall') {
                  return objectMap(days, (day, value) => {
                    if (day !== 'rainfall') {
                      return {
                        date: `${year}-${month}-${day}`,
                        rainfall: value,
                      };
                    }
                  });
                }
              });
            });
            console.log(rainfall.flat(2).filter((obj) => obj));
            return rainfall.flat(2).filter((obj) => obj);
          }),
      },
    },
  }),
});

app.use(
  '/graphql',
  cors(),
  graphqlHTTP({
    schema: schema,
    graphiql: true,
    formatError: (error) => ({
      message: error.message,
      locations: error.locations,
      stack: error.stack ? error.stack.split('\n') : [],
      path: error.path,
    }),
  })
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
