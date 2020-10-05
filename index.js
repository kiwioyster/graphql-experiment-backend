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
      type: GraphQLFloat,
    },
    rainfall: {
      type: GraphQLFloat,
    },
  }),
});
const AvgRainfallDataType = new GraphQLObjectType({
  name: 'AvgRainfallData',
  fields: () => ({
    month: {
      type: GraphQLInt,
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
      monthlyAvgRainfall: {
        type: new GraphQLList(AvgRainfallDataType),
        resolve: (_) =>
          readJson.then((data) => {
            const rainfall = objectMap(JSON.parse(data), (year, months) => {
              return objectMap(months, (month, value) => {
                if (month !== 'rainfall') {
                  return {
                    date: new Date(`${year}-${month}`).getTime(),
                    rainfall: value.rainfall,
                  };
                }
              });
            });
            const avgRainfall = rainfall
              .flat()
              .filter((obj) => obj)
              .reduce(
                (sum, current) => {
                  const d = new Date(current.date);
                  console.log(sum);
                  console.log(d.getMonth());
                  sum[d.getMonth()].total += current.rainfall;
                  sum[d.getMonth()].count++;
                  return sum;
                },
                [
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                  { total: 0, count: 0 },
                ]
              )
              .map((monthData, i) => {
                return {
                  month: i,
                  rainfall: monthData.total / monthData.count,
                };
              });
            return avgRainfall;
          }),
      },
      yearlyRainfall: {
        type: new GraphQLList(RainfallDataType),
        resolve: (_) =>
          readJson.then((data) => {
            const rainfall = objectMap(JSON.parse(data), (key, value) => {
              return {
                date: new Date(key).getTime(),
                rainfall: value.rainfall,
              };
            });
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
                  return {
                    date: new Date(`${year}-${month}`).getTime(),
                    rainfall: value.rainfall,
                  };
                }
              });
            });
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
                        date: new Date(`${year}-${month}-${day}`).getTime(),
                        rainfall: value,
                      };
                    }
                  });
                }
              });
            });
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
  })
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
