const { GraphQLServer } = require("graphql-yoga");
const fetch = require("node-fetch");

// const starterParams = "?format=json&parameterCd=00010&period=PT2H";
// const starterParams = "?format=json";
const starterParams = "?format=json&period=PT2H";
const baseURL = `https://waterservices.usgs.gov/nwis/iv/${starterParams}`;


let waterKey = {
  river: ['river', 'rv', 'rio', 'trib', 'tributary'],
  lake: ['lake', 'lk'],
  waterfall: ['waterfall'],
  creek: ['creek', 'ck'],
  sound: ['sound'],
  canal: ['canal'],
  estuary: ['estuary']
};
// Convert Degress to Radians
function Deg2Rad( deg ) {
  return deg * Math.PI / 180;
}

function PythagorasEquirectangular( lat1, lon1, lat2, lon2 ) {
  lat1 = Deg2Rad(lat1);
  lat2 = Deg2Rad(lat2);
  lon1 = Deg2Rad(lon1);
  lon2 = Deg2Rad(lon2);
  var R = 6371; // km
  var x = (lon2-lon1) * Math.cos((lat1+lat2)/2);
  var y = (lat2-lat1);
  var d = Math.sqrt(x*x + y*y) * R;
  return d;
}

function NearestCity(latitude, longitude, locations) {
  var mindif=99999;
  var closest;

  for (index = 0; index < locations.length; ++index) {
    var dif =  PythagorasEquirectangular(latitude, longitude, locations[ index ][ 1 ], locations[ index ][ 2 ]);
    if ( dif < mindif ) {
      closest=index;
      mindif = dif;
    }
  }

  // return the nearest location
  var closestLocation = (locations[ closest ]);
  console.log('The closest location is ' + closestLocation[0]);
  return closestLocation[0];
}

const determineType = name => {
  name = name.toLowerCase();
  let type = 'none';
  Object.keys(waterKey).forEach(function (waterType) {
    let typeArr = waterKey[waterType]; // value
    typeArr.forEach(str => {
      if (name.includes(str)) {
        type = waterType
      }
    });
  });
  return type;
};

const resolvers = {
  Query: {
    water: (parent, args) => {
      const { state } = args;
      return fetch(`${baseURL}&stateCd=${state}`).then(res => res.json());
    }
  },
  WaterInfo: {
    all: parent => parent,
    value: parent => parent.name,
    sites: parent => parent.value.timeSeries,
    counts: function(parent) {
      let allResults = parent.value.timeSeries;
      let countMap = {};
      allResults.forEach(result => {
        let type = determineType(result.sourceInfo.siteName);
        if (typeof countMap[type] !== 'undefined') {
          countMap[type]['label'] = type;
          countMap[type]['count'] = countMap[type]['count'] + 1;
        } else {
          countMap[type] = {};
          countMap[type]['label'] = type;
          countMap[type]['count'] = 1;
        }
      });
      let countArr = [];
      Object.keys(countMap).forEach(function (countItem) {
        countArr.push({
          label: countMap[countItem]['label'],
          count: countMap[countItem]['count']
        })
      })
      return countArr;
    },
    closest: function(parent, args) {
      const { lat, long } = args;
      let allResults = parent.value.timeSeries;
      let geoArr = [];
      allResults.forEach(result => {
        let geo = result.sourceInfo.geoLocation.geogLocation;
        let name = result.sourceInfo.siteName;
        let geoLat = geo.latitude;
        let geoLong = geo.longitude;
        geoArr.push([
          name,
          geoLat,
          geoLong

        ])
      });
      return NearestCity(lat, long, geoArr);
    }
  },
  Sites: {
    name: parent => parent.sourceInfo.siteName,
    id: parent => parent.sourceInfo.siteCode[0].value,
    temp: function(parent) {
      let temp = "none";
      if (typeof parent.values[0].value[0] !== "undefined") {
        temp = parent.values[0].value[0].value;
        temp = parseInt(temp)
        temp = temp * (9 / 5) + 32
      }
      return temp;
    },
    type: parent => determineType(parent.sourceInfo.siteName)
  },
  Counts: {
    count: parent => parent.count,
    label: parent => parent.label,
  }
};
const typeDefs = `
  type Query {
    info: String!
    water(state: ID!): WaterInfo!
  }

  type WaterInfo {
    all: String!,
    value: String!,
    sites: [Sites!]!,
    counts: [Counts!]!,
    closest(lat: String!, long: String!): String!
  }

  type Sites {
    id: String!,
    name: String!,
    temp: String!,
    type: String!,
  }

  type Counts {
    count: String!,
    label: String!
  }
`
const server = new GraphQLServer({
  typeDefs,
  resolvers
});

server.start(() => console.log(`Server is running on http://localhost:4000`));
